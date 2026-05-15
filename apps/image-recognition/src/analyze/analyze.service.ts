import {
  BadGatewayException,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { OpenAIVisionClient } from "./openai-vision.client";
import type { AnalysisResult } from "./schema";
import type { AnalyzeImageDto } from "./dto/analyze-image.dto";

const truncateUrl = (url: string, max = 80): string =>
  url.length <= max ? url : `${url.slice(0, max)}...(+${url.length - max} chars)`;

@Injectable()
export class AnalyzeService implements OnModuleInit {
  private readonly logger = new Logger(AnalyzeService.name);
  private client!: OpenAIVisionClient;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const apiKey = this.config.get<string>("OPENAI_API_KEY");
    if (!apiKey) {
      this.logger.error("OPENAI_API_KEY missing — refusing to start");
      throw new Error(
        "OPENAI_API_KEY is required. Set it in apps/image-recognition/.env",
      );
    }
    const model = this.config.get<string>("OPENAI_VISION_MODEL") ?? "gpt-4o-mini";
    this.logger.log(
      `Initialized. model=${model} apiKey=sk-...${apiKey.slice(-4)}`,
    );
    this.client = new OpenAIVisionClient(apiKey, model);
  }

  async analyze(input: AnalyzeImageDto): Promise<AnalysisResult> {
    const requestId = randomUUID().slice(0, 8);
    const tag = `[req=${requestId}]`;
    const startedAt = Date.now();

    this.logger.log(
      `${tag} POST /analyze lang=${input.language} url=${truncateUrl(input.imageUrl)}`,
    );

    let result: AnalysisResult;
    try {
      result = await this.client.analyze({
        imageUrl: input.imageUrl,
        language: input.language,
        requestId,
      });
    } catch (err) {
      const elapsedMs = Date.now() - startedAt;
      this.logger.warn(`${tag} analyze failed after ${elapsedMs}ms`);
      throw err;
    }

    const elapsedMs = Date.now() - startedAt;

    if (result.language !== input.language) {
      this.logger.warn(
        `${tag} language mismatch: requested="${input.language}" got="${result.language}" — rejecting`,
      );
      throw new BadGatewayException(
        `Model returned language "${result.language}" but "${input.language}" was requested`,
      );
    }

    const itemNames = result.items.map((i) => i.name).join(", ") || "(none)";
    const avgConfidence =
      result.items.length === 0
        ? 0
        : result.items.reduce((s, i) => s + i.confidence, 0) / result.items.length;
    this.logger.log(
      `${tag} ok ${elapsedMs}ms items=${result.items.length} kcal=${result.totals.calories.toFixed(0)} protein=${result.totals.proteinGrams.toFixed(1)}g carbs=${result.totals.carbsGrams.toFixed(1)}g fat=${result.totals.fatGrams.toFixed(1)}g avgConfidence=${avgConfidence.toFixed(2)} names=[${itemNames}]`,
    );
    if (result.notes) {
      this.logger.debug(`${tag} model notes: ${result.notes}`);
    }

    return result;
  }
}
