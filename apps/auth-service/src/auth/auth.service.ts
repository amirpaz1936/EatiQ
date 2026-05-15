import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserDocument } from "@eatiq/db";
import { HashingService } from "../common/hashing.service";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import {
  AuthUser,
  JwtPayload,
} from "./interfaces/jwt-payload.interface";

export interface AuthResult {
  accessToken: string;
  user: { id: string; email: string; name: string | null };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashing: HashingService,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.passwordHash) return null;
    const ok = await this.hashing.compare(password, user.passwordHash);
    if (!ok) return null;
    return { id: user._id.toString(), email: user.email };
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException("Email already registered");
    const passwordHash = await this.hashing.hash(dto.password);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      name: dto.name ?? null,
    });
    return this.toAuthResult(user);
  }

  login(user: AuthUser): AuthResult {
    return {
      accessToken: this.signToken(user),
      user: { id: user.id, email: user.email, name: null },
    };
  }

  async loginWithGoogleProfile(profile: {
    googleId: string;
    email: string;
    name: string | null;
  }): Promise<AuthUser> {
    let user = await this.usersService.findByGoogleId(profile.googleId);
    if (!user) {
      const byEmail = await this.usersService.findByEmail(profile.email);
      if (byEmail) {
        user = await this.usersService.linkGoogleAccount(
          byEmail._id.toString(),
          profile.googleId,
          profile.name,
        );
      } else {
        user = await this.usersService.create({
          email: profile.email,
          passwordHash: null,
          name: profile.name,
          googleId: profile.googleId,
        });
      }
    }
    if (!user) throw new UnauthorizedException("Failed to resolve user");
    return { id: user._id.toString(), email: user.email };
  }

  issueJwt(user: AuthUser): string {
    return this.signToken(user);
  }

  private signToken(user: AuthUser): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwt.sign(payload);
  }

  private toAuthResult(user: UserDocument): AuthResult {
    const id = user._id.toString();
    const authUser: AuthUser = { id, email: user.email };
    return {
      accessToken: this.signToken(authUser),
      user: { id, email: user.email, name: user.name },
    };
  }
}
