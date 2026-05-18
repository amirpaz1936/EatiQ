import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  UnauthorizedException,
} from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller("profile")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async get(@Headers("x-user-id") userId?: string) {
    if (!userId) throw new UnauthorizedException();
    return this.profileService.get(userId);
  }

  @Patch()
  async update(
    @Headers("x-user-id") userId: string | undefined,
    @Body() dto: UpdateProfileDto,
  ) {
    if (!userId) throw new UnauthorizedException();
    return this.profileService.update(userId, dto);
  }
}
