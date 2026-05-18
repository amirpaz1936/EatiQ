import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import { User } from "./user.schema";

export const GOALS = [
  "weight_loss",
  "pregnancy",
  "maintenance",
  "muscle_gain",
  "crohns",
] as const;
export type Goal = (typeof GOALS)[number];

export const DIET_TYPES = [
  "balanced",
  "vegetarian",
  "vegan",
  "keto",
  "gluten_free",
  "low_fodmap",
] as const;
export type DietType = (typeof DIET_TYPES)[number];

@Schema({ timestamps: true })
export class Profile {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: GOALS, required: true })
  goal!: Goal;

  @Prop({ type: Number, required: true, min: 0 })
  heightCm!: number;

  @Prop({ type: Number, required: true, min: 0 })
  weightKg!: number;

  @Prop({ type: Number, required: true, min: 0 })
  targetCaloriesDaily!: number;

  @Prop({ type: String, enum: DIET_TYPES, required: true })
  dietType!: DietType;

  @Prop({ type: String, default: "" })
  avoid!: string;

  @Prop({ type: String, default: "" })
  notes!: string;
}

export type ProfileDocument = HydratedDocument<Profile>;

export const ProfileSchema = SchemaFactory.createForClass(Profile);
