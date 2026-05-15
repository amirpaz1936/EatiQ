import { Controller, Get, Headers } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-email") userEmail?: string,
  ): string {
    return this.appService.getGreeting(userId, userEmail);
  }
}
