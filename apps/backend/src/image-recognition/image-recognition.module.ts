import { Module } from "@nestjs/common";
import { ImageRecognitionController } from "./image-recognition.controller";
import { ImageRecognitionService } from "./image-recognition.service";
import { S3ClientProvider } from "./s3.client";

@Module({
  controllers: [ImageRecognitionController],
  providers: [ImageRecognitionService, S3ClientProvider],
  exports: [S3ClientProvider],
})
export class ImageRecognitionModule {}
