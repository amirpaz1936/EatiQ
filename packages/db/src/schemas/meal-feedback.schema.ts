import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import { User } from "./user.schema";
import { UserMeal } from "./user-meal.schema";

export const SENTIMENTS = ["good", "neutral", "bad"] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

@Schema({ timestamps: true })
export class MealFeedback {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: UserMeal.name,
    required: true,
    index: true,
  })
  mealId!: Types.ObjectId;

  @Prop({ type: String, default: "" })
  feeling!: string;

  @Prop({ type: String, enum: SENTIMENTS, default: null })
  sentiment!: Sentiment | null;

  @Prop({ type: String, default: "" })
  symptoms!: string;
}

export type MealFeedbackDocument = HydratedDocument<MealFeedback>;

export const MealFeedbackSchema = SchemaFactory.createForClass(MealFeedback);

MealFeedbackSchema.index({ userId: 1, createdAt: -1 });

// One feedback per meal. Re-submitting for the same meal is an edit, not a new
// entry — without this, corrections stack and the insights summarizer keeps folding
// in superseded opinions alongside the correction.
MealFeedbackSchema.index({ userId: 1, mealId: 1 }, { unique: true });
