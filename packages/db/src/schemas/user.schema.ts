import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({ type: String, default: null })
  passwordHash!: string | null;

  @Prop({ type: String, default: null })
  googleId!: string | null;

  @Prop({ type: String, default: null })
  name!: string | null;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);

export const GOOGLE_ID_INDEX_NAME = "googleId_1";

UserSchema.index(
  { googleId: 1 },
  {
    name: GOOGLE_ID_INDEX_NAME,
    unique: true,
    partialFilterExpression: { googleId: { $type: "string" } },
  },
);
