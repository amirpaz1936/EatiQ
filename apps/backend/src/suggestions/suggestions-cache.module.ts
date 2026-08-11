import { Module } from "@nestjs/common";
import { SuggestionsCacheService } from "./suggestions-cache.service";

@Module({
  providers: [SuggestionsCacheService],
  exports: [SuggestionsCacheService],
})
export class SuggestionsCacheModule {}
