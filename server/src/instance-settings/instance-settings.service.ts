import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstanceSettings } from './entities/instance-settings.entity';
import { UpdateInstanceSettingsDto } from './dto/update-instance-settings.dto';
import { User } from 'src/user/entities/user.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class InstanceSettingsService {
  private readonly logger = new Logger(InstanceSettingsService.name);
  private cachedSettings: InstanceSettings | null = null;
  private cachedTransporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectRepository(InstanceSettings)
    private readonly settingsRepository: Repository<InstanceSettings>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getSettings(): Promise<InstanceSettings> {
    if (this.cachedSettings) return this.cachedSettings;

    let settings = await this.settingsRepository.findOne({ where: {} });
    if (!settings) {
      settings = this.settingsRepository.create({
        instanceName: 'DocXtractor',
        allowPublicSignup: false,
      });
      settings = await this.settingsRepository.save(settings);
    }

    this.cachedSettings = settings;
    return settings;
  }

  async updateSettings(
    dto: UpdateInstanceSettingsDto,
  ): Promise<InstanceSettings> {
    const settings = await this.getSettings();
    Object.assign(settings, dto);

    const saved = await this.settingsRepository.save(settings);

    // Invalidate caches
    this.cachedSettings = null;
    this.cachedTransporter = null;

    return saved;
  }

  async isInitialized(): Promise<boolean> {
    const count = await this.userRepository.count({
      where: { role: 'admin' },
    });
    return count > 0;
  }

  async hasAnyAdminUsers(): Promise<boolean> {
    const count = await this.userRepository.count({
      where: { role: 'admin' },
    });
    return count > 0;
  }

  async getPublicStatus(): Promise<{
    isInitialized: boolean;
    allowPublicSignup: boolean;
    instanceName: string;
    googleOAuthEnabled: boolean;
  }> {
    const [settings, initialized] = await Promise.all([
      this.getSettings(),
      this.isInitialized(),
    ]);

    return {
      isInitialized: initialized,
      allowPublicSignup: settings.allowPublicSignup,
      instanceName: settings.instanceName,
      googleOAuthEnabled: settings.isGoogleOAuthConfigured,
    };
  }

  async getSmtpTransporter(): Promise<nodemailer.Transporter | null> {
    if (this.cachedTransporter) return this.cachedTransporter;

    const settings = await this.getSettings();
    if (!settings.isSmtpConfigured) {
      this.logger.warn('SMTP is not configured');
      return null;
    }

    this.cachedTransporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    });

    return this.cachedTransporter;
  }

  async testSmtp(
    recipientEmail?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const transporter = await this.getSmtpTransporter();
    if (!transporter) {
      return { success: false, error: 'SMTP is not configured' };
    }

    const settings = await this.getSettings();
    const to = recipientEmail || settings.smtpUser;

    try {
      await transporter.sendMail({
        from: `"${settings.instanceName}" <${settings.smtpUser}>`,
        to,
        subject: `${settings.instanceName} - SMTP Test`,
        html: '<p>This is a test email from your DocXtractor instance. SMTP is configured correctly!</p>',
      });
      return { success: true };
    } catch (error) {
      this.logger.error('SMTP test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Returns sanitized settings (no SMTP password exposed)
   */
  sanitize(settings: InstanceSettings) {
    return {
      ...settings,
      smtpPass: settings.smtpPass ? '••••••••' : null,
      googleOAuthClientSecret: settings.googleOAuthClientSecret
        ? '••••••••'
        : null,
      isSmtpConfigured: settings.isSmtpConfigured,
      isGoogleOAuthConfigured: settings.isGoogleOAuthConfigured,
    };
  }
}
