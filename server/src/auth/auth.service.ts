import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User, UserRole } from 'src/user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Profile } from 'passport-google-oauth20';
import { ResetPasswordInitiateDto } from './dto/reset-password.dto';
import { UpdateEmailDto } from 'src/user/dto/update-email.dto';
import { JWTPayload } from 'src/shared/types/jwt-payload.types';
import { ResetPasswordConfirmDto } from './dto/reset-password-confirm.dto';
import { SignUpDto } from './dto/signup.dto';
import { MailService } from 'src/shared/mail/mail.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AdminSetupDto } from './dto/admin-setup.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { InstanceSettingsService } from 'src/instance-settings/instance-settings.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly instanceSettingsService: InstanceSettingsService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) return null;

    const isValid = await user.comparePassword(password);
    return isValid ? user : null;
  }

  async adminSetup(dto: AdminSetupDto) {
    const hasUsers = await this.instanceSettingsService.hasAnyUsers();
    if (hasUsers) {
      throw new ForbiddenException(
        'Instance is already initialized. Admin setup is no longer available.',
      );
    }

    // Create admin user (auto-verified, no email needed)
    const user = await this.userService.create({
      email: dto.email,
      password: dto.password,
      role: UserRole.ADMIN,
      isEmailVerified: true,
    } as any);

    // Initialize instance settings
    if (dto.instanceName) {
      await this.instanceSettingsService.updateSettings({
        instanceName: dto.instanceName,
      });
    }

    return this.login(user);
  }

  async signUpWithMagicLink(signUpDto: SignUpDto) {
    const settings = await this.instanceSettingsService.getSettings();
    if (!settings.allowPublicSignup) {
      throw new ForbiddenException(
        'Public signup is disabled. Contact your administrator for an invite.',
      );
    }

    const existingUser = await this.userService.findByEmail(signUpDto.email);
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        throw new ConflictException('Email already registered');
      }
      // Resend magic link for unverified users
      await this.sendMagicLink(existingUser);
      return { message: 'Verification email sent. Please check your inbox.' };
    }

    const user = await this.userService.create({
      ...signUpDto,
      password: signUpDto.password,
      role: 'user' as UserRole,
    });

    await this.sendMagicLink(user);
    return { message: 'Verification email sent. Please check your inbox.' };
  }

  private async sendMagicLink(user: User) {
    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'magic-link' },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5174';
    const verifyUrl = `${frontendUrl}/auth/verify?token=${token}`;

    await this.mailService.sendMagicLink(user.email, verifyUrl);
  }

  async verifyMagicLink(token: string) {
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        email: string;
        type: string;
      }>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      if (payload.type !== 'magic-link') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) throw new NotFoundException('User not found');

      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        await this.userService.save(user);
      }

      return this.login(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired verification link');
    }
  }

  async initiateEmailVerification(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const otp = this.generateSecureOtp(6);
    await user.setOtp(otp);
    await this.userService.save(user);

    await this.mailService.sendOTPCode(user.email, {
      companyName: 'DocXtractor',
      otpCode: otp,
    });
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otp } = verifyEmailDto;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.otpHash')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      return this.login(user);
    }

    const isValid = await this.verifyOtp(user.otpExpiry, user.otpHash, otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    user.isEmailVerified = true;
    user.clearOtp();
    await this.userService.save(user);
    return this.login(user);
  }

  async signUp(createUserDto: SignUpDto) {
    return this.signUpWithMagicLink(createUserDto);
  }

  async login(user: User) {
    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Email not verified. Please verify your email first.',
      );
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role as UserRole,
      false,
      '',
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        hasProfile: false,
        fullName: '',
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JWTPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: [],
      });

      if (!user) throw new UnauthorizedException('User not found');

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await this.generateTokens(
          user.id,
          user.email,
          user.role as UserRole,
          false,
          '',
        );
      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyTokens(
    accessToken: string,
    refreshToken: string,
  ): Promise<string | boolean> {
    try {
      await this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const payload = this.jwtService.verify<JWTPayload>(accessToken, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      return payload.sub;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  async initiatePasswordReset(
    resetPassword: ResetPasswordInitiateDto,
  ): Promise<void> {
    const user = await this.userService.findByEmail(resetPassword.email);
    if (!user) return; // Don't reveal if user doesn't exist

    const resetToken = this.generateResetToken(user.id, user.email);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5174';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;
    await this.mailService.sendResetPasswordEmail(user.email, resetLink);
  }

  updatePassword(userId: string, email: string) {
    return { userId, email };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordConfirmDto,
  ): Promise<void> {
    const email = this.verifyPasswordResetToken(resetPasswordDto.token);
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) throw new NotFoundException('User not found');

    user.passwordHash = resetPasswordDto.newPassword;
    await this.userService.save(user);
  }

  async updateEmail(
    userId: string,
    updateEmailDto: UpdateEmailDto,
  ): Promise<void> {
    const existingUser = await this.userService.findByEmail(
      updateEmailDto.newEmail,
    );
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const user = await this.userService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    user.email = updateEmailDto.newEmail;
    await this.userService.save(user);
  }

  async googleLogin(profile: Profile) {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new BadRequestException('Google profile missing email');

    const googleId = profile.id;

    let user = await this.userService.findByEmail(email);

    if (!user) {
      user = await this.userService.create({
        email,
        googleId,
        isEmailVerified: true,
        passwordHash: null,
      } as unknown as CreateUserDto & { isVerified: boolean });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await this.userService.save(user);
    }

    return this.login(user);
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
    hasProfile: boolean = false,
    fullName: string = '',
  ) {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, email, role, hasProfile, fullName),
      this.generateRefreshToken(userId, email, role, hasProfile, fullName),
    ]);

    return { accessToken, refreshToken };
  }

  private generateAccessToken(
    userId: string,
    email: string,
    role: UserRole,
    hasProfile: boolean = false,
    fullName: string = '',
  ): string {
    return this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
        hasProfile,
        fullName,
      },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );
  }

  private generateRefreshToken(
    userId: string,
    email: string,
    role: UserRole,
    hasProfile: boolean = false,
    fullName: string = '',
  ): string {
    return this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
        hasProfile,
        fullName,
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );
  }

  private generateResetToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.configService.get<string>('JWT_RESET_SECRET'),
        expiresIn: '1h',
      },
    );
  }

  private verifyPasswordResetToken(token: string): string {
    try {
      const payload = this.jwtService.verify<JWTPayload>(token, {
        secret: this.configService.get<string>('JWT_RESET_SECRET'),
      });
      return payload.email;
    } catch {
      throw new UnauthorizedException('Invalid password reset token');
    }
  }

  private generateSecureOtp(length = 6): string {
    const digits = '0123456789';
    let otp = '';
    let lastDigit: string | null = null;

    while (otp.length < length) {
      const randomDigit = digits[Math.floor(Math.random() * 10)];

      if (randomDigit === lastDigit) {
        continue;
      }

      otp += randomDigit;
      lastDigit = randomDigit;
    }

    // Ensure not all digits are the same
    if (otp.split('').every((digit) => digit === otp[0])) {
      return this.generateSecureOtp(length);
    }

    return otp;
  }

  async verifyOtp(
    otpExpiry: Date | undefined,
    otpHash: string | undefined,
    otp: string,
  ): Promise<boolean> {
    if (!otpHash || !otpExpiry || otpExpiry < new Date()) {
      return false;
    }
    return bcrypt.compare(otp, otpHash);
  }
}
