import { Request } from "express";
import { AuthUser } from "./jwt-payload.interface";

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
