import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getGreeting(userId?: string, userEmail?: string): string {
    if (userId && userEmail) {
      return `Hello ${userEmail} (${userId}) from EatiQ backend!`;
    }
    return "Hello from EatiQ backend!";
  }
}
