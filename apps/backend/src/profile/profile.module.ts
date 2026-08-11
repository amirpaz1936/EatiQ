import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Profile, ProfileSchema } from "@eatiq/db";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";
import { SuggestionsCacheModule } from "../suggestions/suggestions-cache.module";
import { FeedbackInsightsModule } from "../feedback-insights/feedback-insights.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
    ]),
    SuggestionsCacheModule,
    FeedbackInsightsModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
