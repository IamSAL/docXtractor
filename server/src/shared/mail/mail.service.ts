import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { InstanceSettingsService } from 'src/instance-settings/instance-settings.service';
import {
  otpEmail,
  otpEmailProps,
  ResetPasswordEmail,
  MagicLinkEmail,
} from './templates/mail.templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly instanceSettingsService: InstanceSettingsService,
  ) {}

  private async getTransporter(): Promise<nodemailer.Transporter | null> {
    return this.instanceSettingsService.getSmtpTransporter();
  }

  async sendOTPCode(
    to: string,
    props: otpEmailProps,
  ): Promise<nodemailer.SentMessageInfo> {
    const html = otpEmail({ ...props });
    return this.sendEmail(to, 'Your MFA Code', html);
  }

  async sendResetPasswordEmail(
    to: string,
    resetLink: string,
  ): Promise<nodemailer.SentMessageInfo> {
    const html = ResetPasswordEmail({ resetLink });
    return this.sendEmail(to, 'Reset Your Password', html);
  }

  async sendMagicLink(
    to: string,
    verifyUrl: string,
  ): Promise<nodemailer.SentMessageInfo> {
    const html = MagicLinkEmail({ verifyUrl });
    return this.sendEmail(to, 'Verify your email - DocXtractor', html);
  }

  async sendInviteEmail(
    to: string,
    inviteUrl: string,
    inviterEmail?: string,
  ): Promise<nodemailer.SentMessageInfo> {
    const settings = await this.instanceSettingsService.getSettings();
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited to ${settings.instanceName}</h2>
        <p>${inviterEmail ? `${inviterEmail} has invited you` : 'You have been invited'} to join ${settings.instanceName}.</p>
        <p>Click the link below to create your account:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Accept Invite
        </a>
        <p style="color: #666; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
      </div>
    `;
    return this.sendEmail(
      to,
      `You're invited to ${settings.instanceName}`,
      html,
    );
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<nodemailer.SentMessageInfo> {
    const transporter = await this.getTransporter();
    if (!transporter) {
      this.logger.warn(
        `SMTP not configured — skipping email to ${to} (subject: "${subject}")`,
      );
      return null;
    }

    const settings = await this.instanceSettingsService.getSettings();
    return transporter.sendMail({
      from: `"${settings.instanceName}" <${settings.smtpUser}>`,
      to,
      subject,
      html,
    });
  }
}
