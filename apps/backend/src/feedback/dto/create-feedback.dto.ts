import { SENTIMENTS } from "@eatiq/db";
import { IsIn, IsMongoId, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateFeedbackDto {
  @IsMongoId()
  mealId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feeling?: string;

  @IsOptional()
  @IsIn(SENTIMENTS)
  sentiment?: (typeof SENTIMENTS)[number] | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  symptoms?: string;
}
