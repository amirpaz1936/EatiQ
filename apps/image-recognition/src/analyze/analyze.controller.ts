import { Body, Controller, Post } from "@nestjs/common";
import { AnalyzeService } from "./analyze.service";
import { AnalyzeImageDto } from "./dto/analyze-image.dto";
import type { AnalysisResult } from "./schema";

@Controller()
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post("analyze")
  analyze(@Body() body: AnalyzeImageDto): Promise<AnalysisResult> {
    return this.analyzeService.analyze(body);
  }
}
