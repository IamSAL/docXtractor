import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private static readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    // Use placeholder values if not configured — strategy won't work but app won't crash
    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL: callbackURL || 'http://localhost:3001/auth/google/callback',
      scope: ['email', 'profile'],
    });

    if (!clientID || !clientSecret) {
      GoogleStrategy.logger.warn(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.',
      );
    }
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Profile {
    if (!profile?.emails?.length) {
      throw new UnauthorizedException('Google profile is missing email');
    }

    return profile;
  }
}
