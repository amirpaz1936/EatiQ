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
import { UpdateInsightsDto } from "./dto/update-insights.dto";
import { FeedbackInsightsService } from "../feedback-insights/feedback-insights.service";

@Controller("profile")
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly insights: FeedbackInsightsService,
  ) {}

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

  // Separate from PATCH /profile: these lists are AI-maintained, and a hand-edit has
  // to be recorded as an override so the next regeneration doesn't undo it.
  @Patch("insights")
  async updateInsights(
    @Headers("x-user-id") userId: string | undefined,
    @Body() dto: UpdateInsightsDto,
  ) {
    if (!userId) throw new UnauthorizedException();
    return this.insights.saveManualEdit(userId, dto);
  }
}
