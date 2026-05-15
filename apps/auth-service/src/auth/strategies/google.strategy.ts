import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";
import { AuthService } from "../auth.service";
import { AuthUser } from "../interfaces/jwt-payload.interface";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(config: ConfigService, private readonly authService: AuthService) {
    super({
      clientID: config.getOrThrow<string>("GOOGLE_CLIENT_ID"),
      clientSecret: config.getOrThrow<string>("GOOGLE_CLIENT_SECRET"),
      callbackURL: config.getOrThrow<string>("GOOGLE_CALLBACK_URL"),
      scope: ["profile", "email"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new UnauthorizedException("Google profile has no email"), undefined);
      return;
    }
    const user: AuthUser = await this.authService.loginWithGoogleProfile({
      googleId: profile.id,
      email,
      name: profile.displayName ?? null,
    });
    done(null, user);
  }
}
