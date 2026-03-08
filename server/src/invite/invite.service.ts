import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Invite, InviteStatus } from './entities/invite.entity';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { UserService } from 'src/user/user.service';
import { MailService } from 'src/shared/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class InviteService {
  private readonly logger = new Logger(InviteService.name);

  constructor(
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateInviteDto, createdById: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresInHours = dto.expiresInHours || 48;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const invite = this.inviteRepository.create({
      token,
      email: dto.email || undefined,
      role: dto.role || 'user',
      status: InviteStatus.PENDING,
      createdById,
      expiresAt,
    });

    const saved = await this.inviteRepository.save(invite);

    // Build invite URL
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5174';
    const inviteUrl = `${frontendUrl}/invite/${token}`;

    // Send email if invite has a target email
    if (dto.email) {
      const creator = await this.userService.findOne(createdById);
      await this.mailService.sendInviteEmail(
        dto.email,
        inviteUrl,
        creator?.email,
      );
    }

    return {
      ...saved,
      inviteUrl,
    };
  }

  async findAll(page = 1, limit = 20) {
    const [invites, total] = await this.inviteRepository.findAndCount({
      relations: ['createdBy', 'acceptedBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: invites.map((inv) => ({
        ...inv,
        createdBy: inv.createdBy
          ? { id: inv.createdBy.id, email: inv.createdBy.email }
          : null,
        acceptedBy: inv.acceptedBy
          ? { id: inv.acceptedBy.id, email: inv.acceptedBy.email }
          : null,
      })),
      total,
      page,
      limit,
    };
  }

  async validate(token: string) {
    const invite = await this.inviteRepository.findOne({ where: { token } });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException(`Invite has already been ${invite.status}`);
    }

    if (invite.isExpired) {
      invite.status = InviteStatus.EXPIRED;
      await this.inviteRepository.save(invite);
      throw new BadRequestException('Invite has expired');
    }

    return {
      valid: true,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    };
  }

  async accept(token: string, dto: AcceptInviteDto) {
    const invite = await this.inviteRepository.findOne({ where: { token } });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (!invite.isValid) {
      throw new ForbiddenException('Invite is no longer valid');
    }

    // If invite is email-restricted, enforce it
    if (invite.email && invite.email !== dto.email) {
      throw new ForbiddenException(
        'This invite is restricted to a different email address',
      );
    }

    // Check if email is already taken
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    // Create the user
    const user = await this.userService.create({
      email: dto.email,
      password: dto.password,
      role: invite.role as UserRole,
      isEmailVerified: true,
    } as any);

    // Mark invite as accepted
    invite.status = InviteStatus.ACCEPTED;
    invite.acceptedById = user.id;
    await this.inviteRepository.save(invite);

    return user;
  }

  async revoke(id: string) {
    const invite = await this.inviteRepository.findOne({ where: { id } });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException(`Cannot revoke invite with status: ${invite.status}`);
    }

    invite.status = InviteStatus.REVOKED;
    return this.inviteRepository.save(invite);
  }
}
