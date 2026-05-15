import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

const ROUNDS = 12;

@Injectable()
export class HashingService {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, ROUNDS);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
