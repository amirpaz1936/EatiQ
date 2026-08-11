import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

const MAX_ENTRIES = 20;
const MAX_ENTRY_LENGTH = 60;

/**
 * The full state the user wants the insight lists to hold. Omitted fields are left
 * untouched; an empty array explicitly clears a list.
 */
export class UpdateInsightsDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ENTRIES)
  @IsString({ each: true })
  @MaxLength(MAX_ENTRY_LENGTH, { each: true })
  avoid?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ENTRIES)
  @IsString({ each: true })
  @MaxLength(MAX_ENTRY_LENGTH, { each: true })
  reduce?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ENTRIES)
  @IsString({ each: true })
  @MaxLength(MAX_ENTRY_LENGTH, { each: true })
  enjoyed?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
