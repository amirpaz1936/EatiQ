import { Module } from "@nestjs/common";
import { SuggestionsCacheService } from "./suggestions-cache.service";

// Standalone (Redis is global) so profile + feedback-insights can invalidate the
// cache without importing SuggestionsModule and creating a dependency cycle.
@Module({
  providers: [SuggestionsCacheService],
  exports: [SuggestionsCacheService],
})
export class SuggestionsCacheModule {}
