import { Logger } from "@nestjs/common";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { insightsSchema, type Insights } from "./insights-schema";
import {
  SYSTEM_PROMPT,
  buildUserText,
  type InsightsContext,
} from "./insights-prompt";

export class OpenAIInsightsClient {
  private readonly logger = new Logger(OpenAIInsightsClient.name);
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async summarize(ctx: InsightsContext): Promise<Insights> {
    const tag = `[insights recent=${ctx.recent.length}]`;
    this.logger.log(`${tag} -> OpenAI responses.parse model=${this.model}`);

    const startedAt = Date.now();
    const response = await this.client.responses.parse({
      model: this.model,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserText(ctx) },
      ],
      text: { format: zodTextFormat(insightsSchema, "feedback_insights") },
    });

    const elapsedMs = Date.now() - startedAt;
    const usage = response.usage;
    this.logger.log(
      `${tag} <- OpenAI ${elapsedMs}ms id=${response.id} tokens={in:${usage?.input_tokens ?? "?"}, out:${usage?.output_tokens ?? "?"}, total:${usage?.total_tokens ?? "?"}}`,
    );

    const parsed = response.output_parsed;
    if (!parsed) {
      throw new Error(
        `OpenAI returned no parsed insights (status=${response.status ?? "?"} incomplete=${response.incomplete_details?.reason ?? "?"})`,
      );
    }
    return parsed;
  }
}
