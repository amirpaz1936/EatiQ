import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { FeedbackService } from "./feedback.service";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";

@Controller("feedback")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async create(
    @Headers("x-user-id") userId: string | undefined,
    @Body() dto: CreateFeedbackDto,
  ) {
    if (!userId) throw new UnauthorizedException();
    return this.feedbackService.create(userId, dto);
  }

  @Get()
  async list(
    @Headers("x-user-id") userId: string | undefined,
    @Query("mealIds") mealIds: string | undefined,
  ) {
    if (!userId) throw new UnauthorizedException();
    const ids = (mealIds ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return this.feedbackService.listForMeals(userId, ids);
  }
}
