import { IsIn } from "class-validator";

export const ALLOWED_UPLOAD_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type UploadContentType = (typeof ALLOWED_UPLOAD_CONTENT_TYPES)[number];

export class PresignUploadDto {
  @IsIn(ALLOWED_UPLOAD_CONTENT_TYPES)
  contentType!: UploadContentType;
}
