export const baseStyles = {
  body: "background-color:#ffffff;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;margin:0;padding:0;color:#1a1a1a;",
  container: 'max-width:600px;margin:0 auto;padding:40px 20px;',
  table: 'width:100%;border-collapse:collapse;margin-bottom:15px;',
  labelCell:
    'padding:5px 0;font-weight:600;color:#4b5563;text-align:left;width:40%;',
  valueCell:
    'padding:5px 0;color:#000;text-align:right;width:60%;font-weight:500',
  headerCell:
    'padding: 10px 8px; font-weight: 700; color: #111827; background-color: #f9fafb; text-align: left; border-bottom: 1px solid #e5e7eb;',
  subHeading:
    'font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 20px 0 10px 0; line-height: 1.3; text-align: left;',

  logoSection: 'text-align:center;margin-bottom:40px;',
  logo: 'font-size:24px;font-weight:700;color:#00d4ff;margin:0;letter-spacing:-0.5px;',
  mainCard:
    'background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:40px 32px;text-align:center;box-shadow:0 1px 3px 0 rgba(0, 0, 0, 0.1);',
  heading:
    'font-size:24px;font-weight:600;color:#1a1a1a;margin:0 0 16px 0;line-height:1.3;',
  description:
    'font-size:16px;color:#6b7280;margin:0 0 32px 0;line-height:1.5;',
  otpContainer: 'display:flex;justify-content:center;margin-bottom:32px;',
  otpDigit:
    'font-size:32px;font-weight:700;color:#1a1a1a;font-family:monospace;padding:12px;background-color:#f9fafb;border-radius:8px;border:2px dashed #d1d5db;margin:0 4px;min-width:50px;text-align:center;',
  expiryText: 'font-size:14px;color:#9ca3af;margin:5px 0 5px 0;',
  actionButton:
    'background-color:#00d4ff;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;display:inline-block;margin:5px 0 5px 0;width:100%;max-width:100%;box-sizing:border-box;',
  divider: 'border-top:1px solid #e5e7eb;margin:20px 0;',
  securityWarning:
    'font-size:14px;color:#6b7280;margin:0 0 8px 0;line-height:1.5;text-align:left;',
  supportLink: 'color:#00d4ff;text-decoration:underline;',
  thankYou: 'font-size:16px;color:#1a1a1a;margin:24px 0 0 0;font-weight:500;',
  footer:
    'text-align:center;margin-top:40px;padding:5px 0;border-top:1px solid #f3f4f6;',
  footerText: 'font-size:12px;color:#9ca3af;margin:0 0 4px 0;',
  footerTagline: 'font-size:12px;color:#6b7280;margin:0;',
  contentText:
    'font-size:16px;color:#1a1a1a;margin:0 0 16px 0;line-height:1.5;text-align:left;',
  statusBadge:
    'display:inline-block;padding:4px 12px;border-radius:5px;font-weight:600;margin:0 0 16px 0;width:96%;',
  messageBox:
    'background-color: #F3F4F6; border-left: 4px solid #3B82F6; padding: 12px 16px; margin: 20px 0;',
  messageHeading:
    'font-size: 16px; font-weight: 600; color: #1F2937; margin: 0 0 8px 0;text-align:start;',
  messageText: 'color: #4B5563; margin: 0; line-height: 1.6;text-align:start;',
};

export function baseEmailTemplate({
  companyName = 'DocXtractor',
  title,
  content,
  footerTagline = 'Automated Document Extraction',
}: {
  companyName?: string;
  title: string;
  content: string;
  footerTagline?: string;
}) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="${baseStyles.body}">
      <div style="${baseStyles.container}">
        <!-- Logo Section -->
        <div style="${baseStyles.logoSection}">
          <p style="${baseStyles.logo}">≡ ${companyName}</p>
        </div>

        <!-- Main Content Card -->
        <div style="${baseStyles.mainCard}">
          ${content}
        </div>

        <!-- Footer -->
        <div style="${baseStyles.footer}">
          <p style="${baseStyles.footerText}">
            © ${companyName} Inc ${new Date().getFullYear()}
          </p>
          <p style="${baseStyles.footerTagline}">${footerTagline}</p>
        </div>
      </div>
    </body>
  </html>
  `;
}

export interface otpEmailProps {
  otpCode: string;
  expiryMinutes?: number;
  supportEmail?: string;
  companyName?: string;
}
export function otpEmail({
  otpCode,
  expiryMinutes = 30,
  supportEmail = 'support@example.com',
  companyName = 'DocXtractor',
}: otpEmailProps) {
  const minutesText = expiryMinutes === 1 ? 'minute' : 'minutes';
  const otpDigits = otpCode
    .split('')
    .map((digit) => `<span style="${baseStyles.otpDigit}">${digit}</span>`)
    .join('');

  const content = `
    <h1 style="${baseStyles.heading}">Multi-Factor Authentication</h1>
    <p style="${baseStyles.description}">
      Please use the one-time-password (OTP) below:
    </p>

    <div style="${baseStyles.otpContainer}">
      ${otpDigits}
    </div>

    <p style="${baseStyles.expiryText}">
      The OTP will expire in ${expiryMinutes} ${minutesText}.
    </p>

    <hr style="${baseStyles.divider}" />

    <p style="${baseStyles.securityWarning}">
      If you did not initiate this request, please reset your password immediately and contact
      <a href="mailto:${supportEmail}" style="${baseStyles.supportLink}">
        ${supportEmail}
      </a>.
    </p>
    <p style="${baseStyles.thankYou}">Thank you.</p>
  `;

  return baseEmailTemplate({
    companyName,
    title: 'Your MFA Code',
    content,
  });
}

export function MagicLinkEmail({
  verifyUrl,
  companyName = 'DocXtractor',
}: {
  verifyUrl: string;
  companyName?: string;
}) {
  const content = `
    <h1 style="${baseStyles.heading}">Verify Your Email</h1>
    <p style="${baseStyles.description}">
      Click the button below to verify your email and sign in:
    </p>

    <a href="${verifyUrl}" style="${baseStyles.actionButton};">
      Verify Email
    </a>

    <p style="${baseStyles.expiryText}">
      This link will expire in 15 minutes.
    </p>

    <hr style="${baseStyles.divider}" />

    <p style="${baseStyles.securityWarning}">
      If you didn't sign up for ${companyName}, you can safely ignore this email.
    </p>
  `;

  return baseEmailTemplate({
    companyName,
    title: 'Verify Your Email',
    content,
  });
}

export function ResetPasswordEmail({
  resetLink,
  companyName = 'DocXtractor',
}: {
  resetLink: string;
  companyName?: string;
}) {
  const content = `
    <h1 style="${baseStyles.heading}">Reset Your Password</h1>
    <p style="${baseStyles.description}">
      You've requested to reset your password. Click the button below to proceed:
    </p>

    <a href="${resetLink}" style="${baseStyles.actionButton};">
      Reset Password
    </a>

    <p style="${baseStyles.contentText}">
      If you didn't request this, please ignore this email. The link will expire in 1 hour.
    </p>

    <hr style="${baseStyles.divider}" />

    <p style="${baseStyles.securityWarning}">
      For security reasons, do not share this email with anyone.
    </p>
  `;

  return baseEmailTemplate({
    companyName,
    title: 'Password Reset Request',
    content,
  });
}
