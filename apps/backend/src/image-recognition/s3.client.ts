import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client } from "@aws-sdk/client-s3";

@Injectable()
export class S3ClientProvider {
  private readonly logger = new Logger(S3ClientProvider.name);

  readonly bucket: string;
  readonly publicClient: S3Client;
  readonly internalClient: S3Client;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>("S3_BUCKET");
    const region = config.getOrThrow<string>("S3_REGION");
    const accessKeyId = config.getOrThrow<string>("S3_ACCESS_KEY");
    const secretAccessKey = config.getOrThrow<string>("S3_SECRET_KEY");
    const publicEndpoint = config.getOrThrow<string>("S3_PUBLIC_ENDPOINT");
    const internalEndpoint = config.getOrThrow<string>("S3_INTERNAL_ENDPOINT");

    const common = {
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    };

    this.publicClient = new S3Client({ ...common, endpoint: publicEndpoint });
    this.internalClient = new S3Client({ ...common, endpoint: internalEndpoint });

    this.logger.log(
      `S3 ready bucket=${this.bucket} public=${publicEndpoint} internal=${internalEndpoint}`,
    );
  }
}
