import { BadGatewayException, BadRequestException, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { buildAnalysisSchema, type AnalysisResult } from "./schema";
import { SYSTEM_PROMPT, buildUserText } from "./prompt";

export interface VisionRequest {
  imageUrl: string;
  language: string;
  requestId: string;
}

const truncateUrl = (url: string, max = 80): string =>
  url.length <= max ? url : `${url.slice(0, max)}...(+${url.length - max} chars)`;

// Set IMAGE_FETCH_MODE=base64 in local dev so OpenAI doesn't need to reach our
// bucket (Minio at localhost:9000 / minio:9000 isn't routable from OpenAI).
// In production, leave unset and OpenAI fetches the URL itself.
async function resolveImageForOpenAI(
  imageUrl: string,
  logger: Logger,
  tag: string,
): Promise<string> {
  if (process.env.IMAGE_FETCH_MODE !== "base64") return imageUrl;

  logger.log(`${tag} fetching image bytes for base64 inlining`);
  let res: Response;
  try {
    res = await fetch(imageUrl);
  } catch (err) {
    logger.error(`${tag} fetch failed: ${err}`);
    throw new BadGatewayException("Failed to fetch image for analysis");
  }
  if (!res.ok) {
    logger.error(`${tag} fetch status=${res.status}`);
    throw new BadGatewayException(
      `Failed to fetch image: upstream returned ${res.status}`,
    );
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export class OpenAIVisionClient {
  private readonly logger = new Logger(OpenAIVisionClient.name);
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async analyze({ imageUrl, language, requestId }: VisionRequest): Promise<AnalysisResult> {
    const schema = buildAnalysisSchema(language);
    const tag = `[req=${requestId}]`;

    const resolvedImage = await resolveImageForOpenAI(imageUrl, this.logger, tag);
    const isDataUrl = resolvedImage.startsWith("data:");

    this.logger.log(
      `${tag} -> OpenAI responses.parse model=${this.model} lang=${language} detail=high source=${isDataUrl ? "base64-inline" : "url"} url=${truncateUrl(isDataUrl ? resolvedImage.slice(0, 40) : resolvedImage)}`,
    );

    const startedAt = Date.now();
    let response;
    try {
      response = await this.client.responses.parse({
        model: this.model,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "input_text", text: buildUserText(language) },
              { type: "input_image", image_url: resolvedImage, detail: "high" },
            ],
          },
        ],
        text: { format: zodTextFormat(schema, "food_analysis") },
      });
    } catch (err) {
      const elapsedMs = Date.now() - startedAt;
      if (err instanceof OpenAI.APIError) {
        this.logger.error(
          `${tag} OpenAI APIError after ${elapsedMs}ms status=${err.status ?? "?"} type=${err.type ?? "?"} code=${err.code ?? "?"}: ${err.message}`,
        );
        if (err.status && err.status >= 400 && err.status < 500) {
          throw new BadRequestException(`OpenAI rejected the request: ${err.message}`);
        }
        throw new BadGatewayException(`OpenAI upstream error: ${err.message}`);
      }
      this.logger.error(`${tag} Non-API error after ${elapsedMs}ms`, err);
      throw new BadGatewayException("Failed to reach OpenAI");
    }

    const elapsedMs = Date.now() - startedAt;
    const usage = response.usage;
    this.logger.log(
      `${tag} <- OpenAI ${elapsedMs}ms id=${response.id} status=${response.status ?? "?"} tokens={in:${usage?.input_tokens ?? "?"}, out:${usage?.output_tokens ?? "?"}, total:${usage?.total_tokens ?? "?"}}`,
    );

    const parsed = response.output_parsed;
    if (!parsed) {
      this.logger.error(
        `${tag} OpenAI returned no parsed output. status=${response.status ?? "?"} incomplete_reason=${response.incomplete_details?.reason ?? "?"} output_items=${response.output?.length ?? 0}`,
      );
      throw new BadGatewayException(
        "OpenAI returned no parsed structured output (refusal or empty response)",
      );
    }
    return parsed;
  }
}
