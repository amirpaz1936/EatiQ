import {
  BadGatewayException,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { S3ClientProvider } from "./s3.client";
import {
  ALLOWED_UPLOAD_CONTENT_TYPES,
  type UploadContentType,
} from "./dto/presign-upload.dto";

const PUT_PRESIGN_EXPIRES_SECONDS = 15 * 60;
const GET_PRESIGN_EXPIRES_SECONDS = 5 * 60;

const EXTENSION_BY_CONTENT_TYPE: Record<UploadContentType, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface PresignResult {
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
}

@Injectable()
export class ImageRecognitionService {
  private readonly logger = new Logger(ImageRecognitionService.name);
  private readonly imageRecognitionUrl: string;

  constructor(
    private readonly s3: S3ClientProvider,
    config: ConfigService,
  ) {
    this.imageRecognitionUrl = config
      .getOrThrow<string>("IMAGE_RECOGNITION_URL")
      .replace(/\/+$/, "");
  }

  async presignUpload(
    userId: string,
    contentType: UploadContentType,
  ): Promise<PresignResult> {
    if (!ALLOWED_UPLOAD_CONTENT_TYPES.includes(contentType)) {
      // Validation pipe already enforces this; defensive fallback.
      throw new ForbiddenException("Unsupported content type");
    }

    const ext = EXTENSION_BY_CONTENT_TYPE[contentType];
    const objectKey = `users/${userId}/${uuidv4()}.${ext}`;
    const command = new PutObjectCommand({
      Bucket: this.s3.bucket,
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3.publicClient, command, {
      expiresIn: PUT_PRESIGN_EXPIRES_SECONDS,
    });

    this.logger.log(`presigned PUT user=${userId} key=${objectKey}`);

    return {
      uploadUrl,
      objectKey,
      expiresInSeconds: PUT_PRESIGN_EXPIRES_SECONDS,
    };
  }

  async analyze(
    userId: string,
    objectKey: string,
    language: string,
  ): Promise<unknown> {
    const prefix = `users/${userId}/`;
    if (!objectKey.startsWith(prefix)) {
      throw new ForbiddenException("objectKey does not belong to caller");
    }

    const getCmd = new GetObjectCommand({
      Bucket: this.s3.bucket,
      Key: objectKey,
    });
    const imageUrl = await getSignedUrl(this.s3.internalClient, getCmd, {
      expiresIn: GET_PRESIGN_EXPIRES_SECONDS,
    });

    const target = `${this.imageRecognitionUrl}/analyze`;
    this.logger.log(`-> ${target} user=${userId} key=${objectKey} lang=${language}`);

    let response: Response;
    try {
      response = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, language }),
      });
    } catch (err) {
      this.logger.error(`image-recognition unreachable: ${err}`);
      throw new BadGatewayException("image-recognition service unreachable");
    }

    const bodyText = await response.text();
    if (!response.ok) {
      this.logger.error(
        `<- ${target} status=${response.status} body=${bodyText.slice(0, 200)}`,
      );
      throw new BadGatewayException(
        `image-recognition responded ${response.status}: ${bodyText.slice(0, 200)}`,
      );
    }

    try {
      return JSON.parse(bodyText);
    } catch {
      throw new BadGatewayException(
        "image-recognition returned non-JSON response",
      );
    }
  }
}
