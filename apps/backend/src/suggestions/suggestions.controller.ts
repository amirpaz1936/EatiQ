import {
  Controller,
  Get,
  Headers,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { SuggestionsService } from "./suggestions.service";
import { GetSuggestionsQueryDto } from "./dto/get-suggestions-query.dto";

@Controller("suggestions")
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Get()
  async getSuggestions(
    @Headers("x-user-id") userId: string | undefined,
    @Query() query: GetSuggestionsQueryDto,
  ) {
    if (!userId) throw new UnauthorizedException();
    return this.suggestionsService.getSuggestions(
      userId,
      query.timeZone,
      query.language,
      query.refresh,
    );
  }
}
