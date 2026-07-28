import { BadGatewayException, BadRequestException, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { buildSuggestionsSchema, type SuggestionsResult } from "./schema";
import { SYSTEM_PROMPT, buildUserText, type SuggestionUserContext } from "./prompt";

export class OpenAISuggestionsClient {
  private readonly logger = new Logger(OpenAISuggestionsClient.name);
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async suggest(ctx: SuggestionUserContext): Promise<SuggestionsResult> {
    const schema = buildSuggestionsSchema(ctx.language, ctx.mealSlot);
    const tag = `[slot=${ctx.mealSlot} lang=${ctx.language}]`;

    this.logger.log(`${tag} -> OpenAI responses.parse model=${this.model}`);

    const startedAt = Date.now();
    let response;
    try {
      response = await this.client.responses.parse({
        model: this.model,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserText(ctx) },
        ],
        text: { format: zodTextFormat(schema, "meal_suggestions") },
      });
    } catch (err) {
      const elapsedMs = Date.now() - startedAt;
      if (err instanceof OpenAI.APIError) {
        this.logger.error(
          `${tag} OpenAI APIError after ${elapsedMs}ms status=${err.status ?? "?"} code=${err.code ?? "?"}: ${err.message}`,
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
      `${tag} <- OpenAI ${elapsedMs}ms id=${response.id} tokens={in:${usage?.input_tokens ?? "?"}, out:${usage?.output_tokens ?? "?"}, total:${usage?.total_tokens ?? "?"}}`,
    );

    const parsed = response.output_parsed;
    if (!parsed) {
      this.logger.error(
        `${tag} OpenAI returned no parsed output. status=${response.status ?? "?"} incomplete_reason=${response.incomplete_details?.reason ?? "?"}`,
      );
      throw new BadGatewayException(
        "OpenAI returned no parsed structured output (refusal or empty response)",
      );
    }
    return parsed;
  }
}
