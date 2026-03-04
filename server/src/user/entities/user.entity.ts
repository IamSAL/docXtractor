import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  OneToOne,
} from 'typeorm';

import * as bcrypt from 'bcrypt';
import { Admin } from 'src/admin/entities/admin.entity';
import { Notification } from 'src/notification/entities/notification.entity';
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity()
@Index(['role', 'isEmailVerified'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  passwordHash?: string;

  @Column({ nullable: true, select: false })
  otpHash?: string;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiry?: Date;

  @Column({ nullable: true, unique: true })
  googleId?: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column({
    type: 'enum',
    enum: ['user', 'admin'],
    default: 'user',
  })
  role: string;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToOne(() => Admin, (admin) => admin.user, { cascade: true })
  adminProfile?: Admin;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.passwordHash) {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
  }

  async comparePassword(attempt: string): Promise<boolean> {
    return this.passwordHash
      ? await bcrypt.compare(attempt, this.passwordHash)
      : false;
  }

  async setOtp(otp: string, expiresInMinutes = 30) {
    const salt = await bcrypt.genSalt(10);
    this.otpHash = await bcrypt.hash(otp, salt);

    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + expiresInMinutes);
    this.otpExpiry = expiryDate;
  }

  clearOtp() {
    this.otpHash = undefined;
    this.otpExpiry = undefined;
  }
}
