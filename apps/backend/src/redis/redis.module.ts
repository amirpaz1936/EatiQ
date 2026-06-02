import {
  Global,
  Inject,
  Logger,
  Module,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

// Global so any module can inject REDIS_CLIENT without re-importing. Mirrors the
// async-factory style used for MongooseModule.forRootAsync in app.module.ts.
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const logger = new Logger("RedisModule");
        const url = config.getOrThrow<string>("REDIS_URL");
        const client = new Redis(url, {
          // Keep failures non-fatal: callers wrap get/set in try/catch and
          // degrade to "always generate" if Redis is unavailable.
          maxRetriesPerRequest: 2,
        });
        client.on("error", (err) => logger.error(`Redis error: ${err.message}`));
        client.on("connect", () => logger.log(`Connected to Redis at ${url}`));
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
