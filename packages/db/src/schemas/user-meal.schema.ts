import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import { User } from "./user.schema";

@Schema({ _id: false })
class Nutrition {
  @Prop({ type: Number, required: true, min: 0 })
  calories!: number;

  @Prop({ type: Number, required: true, min: 0 })
  proteinGrams!: number;

  @Prop({ type: Number, required: true, min: 0 })
  carbsGrams!: number;

  @Prop({ type: Number, required: true, min: 0 })
  fatGrams!: number;

  @Prop({ type: Number, required: true, min: 0 })
  fiberGrams!: number;

  @Prop({ type: Number, required: true, min: 0 })
  sugarGrams!: number;

  @Prop({ type: Number, min: 0 })
  saturatedFatGrams?: number;
}
const NutritionSchema = SchemaFactory.createForClass(Nutrition);

@Schema({ _id: false })
class MealItem {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: Number, required: true, min: 0 })
  estimatedWeightGrams!: number;

  @Prop({ type: Number, min: 0, max: 100 })
  relativeAreaPercent?: number;

  @Prop({ type: Number, min: 0, max: 1 })
  confidence?: number;

  @Prop({ type: NutritionSchema, required: true })
  nutrition!: Nutrition;
}
const MealItemSchema = SchemaFactory.createForClass(MealItem);

@Schema({ timestamps: true })
export class UserMeal {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, default: null })
  imageUrl!: string | null;

  // S3/MinIO key of the scanned photo. We store the key rather than a URL because
  // every URL we can hand out is a short-lived presigned one — it must be re-signed
  // on read, not persisted.
  @Prop({ type: String, default: null })
  imageObjectKey!: string | null;

  @Prop({ type: Date, required: true, index: true })
  eatenAt!: Date;

  @Prop({ type: NutritionSchema, required: true })
  totals!: Nutrition;

  @Prop({ type: [MealItemSchema], default: [] })
  items!: MealItem[];

  @Prop({ type: String, default: null })
  language!: string | null;

  @Prop({ type: String, default: "" })
  notes!: string;
}

export type UserMealDocument = HydratedDocument<UserMeal>;

export const UserMealSchema = SchemaFactory.createForClass(UserMeal);

UserMealSchema.index({ userId: 1, eatenAt: -1 });
