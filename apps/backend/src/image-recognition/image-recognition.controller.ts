import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { ImageRecognitionService } from "./image-recognition.service";
import { PresignUploadDto } from "./dto/presign-upload.dto";
import { AnalyzeUploadDto } from "./dto/analyze-upload.dto";

@Controller()
export class ImageRecognitionController {
  constructor(private readonly service: ImageRecognitionService) {}

  @Post("uploads/presign")
  async presign(
    @Headers("x-user-id") userId: string | undefined,
    @Body() dto: PresignUploadDto,
  ) {
    if (!userId) throw new UnauthorizedException();
    return this.service.presignUpload(userId, dto.contentType);
  }

  @Post("image-recognition")
  async analyze(
    @Headers("x-user-id") userId: string | undefined,
    @Body() dto: AnalyzeUploadDto,
  ) {
    if (!userId) throw new UnauthorizedException();
    return this.service.analyze(userId, dto.objectKey, dto.language);
  }
}
