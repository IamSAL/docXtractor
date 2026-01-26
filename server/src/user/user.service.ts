/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersFilterDto } from './dto/find-users-filter.dto';


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      ...createUserDto,
      passwordHash: createUserDto.password,
    });

    const savedUser = await this.userRepository.save(user);
    delete savedUser.passwordHash;
    return savedUser;
  }

  async findAll(
    filterDto?: FindUsersFilterDto,
    id?: string,
    role?: string,
  ): Promise<
    Array<
      User & {
        profile: {
          fullName: string;
          adminType?: string;
          specialty?: string;
        } | null;
      }
    >
  > {
    const query = this.userRepository.createQueryBuilder('user');


    // Apply filters from DTO
    if (filterDto) {
      const { role: dtoRole, email, isEmailVerified, search } = filterDto;

      if (dtoRole) {
        query.andWhere('user.role = :role', { role: dtoRole });
      }

      if (email) {
        query.andWhere('user.email ILIKE :email', { email: `%${email}%` });
      }

      if (isEmailVerified !== undefined) {
        query.andWhere('user.isEmailVerified = :isEmailVerified', {
          isEmailVerified,
        });
      }

      if (search) {
        query.andWhere(
          '(user.email ILIKE :search OR user.id::text ILIKE :search)',
          { search: `%${search}%` },
        );
      }
    }

    if (id && role !== 'admin') {
      query.andWhere('user.id = :id', { id });
      query.andWhere('user.role = :role', { role });
    }

    const users = await query.getMany();

    // Transform each user to include profile field
    return users.map((user) => {
      return {
        ...user,
        profile: null,
      } as User & {
        profile: {
          fullName: string;
          adminType?: string;
          specialty?: string;
        } | null;
      };
    });
  }
  async findOne(id: string): Promise<
    User & {
      profile: {
        fullName: string;
        adminType?: string;
        specialty?: string;
      } | null;
    }
  > {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [],
    });
    console.log(user);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      ...(user as User),

      profile: null,
    } as User & {
      profile: {
        fullName: string;
        adminType?: string;
        specialty?: string;
      } | null;
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Handle password update
    if (updateUserDto.password) {
      user.passwordHash = updateUserDto.password;
      delete updateUserDto.password;
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    delete updatedUser.passwordHash;
    return updatedUser;
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.passwordHash = newPassword;
    await this.userRepository.save(user);
  }

  async updateEmail(id: string, newEmail: string): Promise<User> {
    const user = await this.findOne(id);
    user.email = newEmail;
    return this.userRepository.save(user);
  }

  async save(user: User): Promise<User> {
    const savedUser = await this.userRepository.save(user);
    delete savedUser.passwordHash;
    return savedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
