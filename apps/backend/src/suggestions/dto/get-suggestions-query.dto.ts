import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class GetSuggestionsQueryDto {
  // IANA timezone, e.g. "America/New_York". Used to derive the meal slot from
  // the client's local time. Invalid values fall back to UTC in the service.
  @IsString()
  @MaxLength(100)
  timeZone!: string;

  // ISO 639-1 code. English-only for now, but plumbed through to the LLM.
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  // When true, invalidate the cached suggestions for this slot and regenerate.
  // Backs the "Refresh" button in the suggestions UI.
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  refresh?: boolean;
}
