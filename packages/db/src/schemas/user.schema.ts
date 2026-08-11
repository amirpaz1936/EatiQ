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

/**
 * Unique per linked Google account, but only for users that actually have one.
 *
 * This must be a PARTIAL index, not a sparse one. `sparse` skips documents where the
 * field is absent — and email/password users store an explicit `googleId: null`, which
 * counts as present. Under a sparse unique index they all collide on `null`, so only
 * one password account could ever exist. Filtering on `$type: "string"` indexes only
 * real Google IDs and leaves the nulls out entirely.
 */
export const GOOGLE_ID_INDEX_NAME = "googleId_1";

UserSchema.index(
  { googleId: 1 },
  {
    name: GOOGLE_ID_INDEX_NAME,
    unique: true,
    partialFilterExpression: { googleId: { $type: "string" } },
  },
);
