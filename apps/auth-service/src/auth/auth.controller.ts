import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { AuthenticatedRequest } from "./interfaces/authenticated-request.interface";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  login(@Req() req: AuthenticatedRequest, @Body() _dto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  googleStart(): void {
    // Passport redirects to Google; this handler body is never reached.
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  googleCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): void {
    const token = this.authService.issueJwt(req.user);
    const frontendUrl = this.config.getOrThrow<string>("FRONTEND_URL");
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  @Get("verify")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  verify(@Req() req: AuthenticatedRequest, @Res() res: Response): void {
    // nginx auth_request subrequest target. We surface the verified identity
    // back to nginx via response headers; nginx pulls them into variables
    // with auth_request_set and re-injects them into the upstream request.
    res.setHeader("X-User-Id", req.user.id);
    res.setHeader("X-User-Email", req.user.email);
    res.status(HttpStatus.NO_CONTENT).end();
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) throw new NotFoundException("User not found");
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      hasPassword: user.passwordHash !== null,
      hasGoogle: user.googleId !== null,
    };
  }
}
