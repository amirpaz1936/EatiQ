import { IsString, Length, Matches } from "class-validator";

export class AnalyzeUploadDto {
  @IsString()
  @Matches(/^users\/[a-zA-Z0-9._-]+\/[a-f0-9-]{36}\.(jpg|png|webp)$/, {
    message: "objectKey must be users/<userId>/<uuid>.(jpg|png|webp)",
  })
  objectKey!: string;

  @IsString()
  @Length(2, 5)
  @Matches(/^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$/, {
    message:
      "language must be an ISO 639-1 code (e.g. 'en', 'he', 'fr') or locale (e.g. 'en-US')",
  })
  language!: string;
}
