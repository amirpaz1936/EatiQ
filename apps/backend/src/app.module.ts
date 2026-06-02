import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ImageRecognitionModule } from "./image-recognition/image-recognition.module";
import { FeedbackModule } from "./feedback/feedback.module";
import { MealsModule } from "./meals/meals.module";
import { ProfileModule } from "./profile/profile.module";
import { RedisModule } from "./redis/redis.module";
import { SuggestionsModule } from "./suggestions/suggestions.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>("MONGODB_URI"),
      }),
    }),
    RedisModule,
    ProfileModule,
    ImageRecognitionModule,
    MealsModule,
    FeedbackModule,
    SuggestionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
