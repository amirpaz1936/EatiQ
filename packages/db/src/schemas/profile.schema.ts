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

@Schema({ _id: false })
export class FeedbackInsights {
  @Prop({ type: [String], default: [] })
  avoid!: string[];

  @Prop({ type: [String], default: [] })
  reduce!: string[];

  @Prop({ type: [String], default: [] })
  enjoyed!: string[];

  @Prop({ type: String, default: "" })
  notes!: string;

  @Prop({ type: Number, default: 0 })
  feedbackCount!: number;
}
export const FeedbackInsightsSchema =
  SchemaFactory.createForClass(FeedbackInsights);

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

  @Prop({ type: String, enum: GOALS, default: null })
  goal!: Goal | null;

  @Prop({ type: Number, default: null, min: 0 })
  heightCm!: number | null;

  @Prop({ type: Number, default: null, min: 0 })
  weightKg!: number | null;

  @Prop({ type: Number, default: null, min: 0 })
  targetCaloriesDaily!: number | null;

  @Prop({ type: String, enum: DIET_TYPES, default: null })
  dietType!: DietType | null;

  @Prop({ type: String, default: "" })
  avoid!: string;

  @Prop({ type: String, default: "" })
  notes!: string;

  @Prop({ type: FeedbackInsightsSchema, default: () => ({}) })
  feedbackInsights!: FeedbackInsights;
}

export type ProfileDocument = HydratedDocument<Profile>;

export const ProfileSchema = SchemaFactory.createForClass(Profile);
