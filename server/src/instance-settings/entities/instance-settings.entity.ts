import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class InstanceSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'DocXtractor' })
  instanceName: string;

  @Column({ default: false })
  allowPublicSignup: boolean;

  // SMTP Configuration (stored in DB, not env vars)
  @Column({ nullable: true })
  smtpHost: string;

  @Column({ type: 'int', nullable: true })
  smtpPort: number;

  @Column({ nullable: true })
  smtpUser: string;

  @Column({ nullable: true })
  smtpPass: string;

  @Column({ default: false })
  smtpSecure: boolean;

  // Google OAuth (stored in DB, not env vars)
  @Column({ nullable: true })
  googleOAuthClientId: string;

  @Column({ nullable: true })
  googleOAuthClientSecret: string;

  @Column({ nullable: true })
  googleOAuthCallbackUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get isSmtpConfigured(): boolean {
    return !!(this.smtpHost && this.smtpPort && this.smtpUser && this.smtpPass);
  }

  get isGoogleOAuthConfigured(): boolean {
    return !!(this.googleOAuthClientId && this.googleOAuthClientSecret);
  }
}
