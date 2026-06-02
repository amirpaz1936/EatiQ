import {
  Body,
  Controller,
  Headers,
  Post,
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
}
