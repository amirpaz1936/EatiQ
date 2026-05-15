import { IsString, IsUrl, Length, Matches } from "class-validator";

export class AnalyzeImageDto {
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] })
  imageUrl!: string;

  @IsString()
  @Length(2, 5)
  @Matches(/^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$/, {
    message:
      "language must be an ISO 639-1 code (e.g. 'en', 'he', 'fr') or locale (e.g. 'en-US')",
  })
  language!: string;
}
