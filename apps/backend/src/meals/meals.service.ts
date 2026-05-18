import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserMeal, UserMealDocument } from "@eatiq/db";
import { Model, Types } from "mongoose";
import type { CreateMealDto } from "./dto/create-meal.dto";

@Injectable()
export class MealsService {
  constructor(
    @InjectModel(UserMeal.name)
    private readonly userMealModel: Model<UserMealDocument>,
  ) {}

  async create(userId: string, dto: CreateMealDto): Promise<UserMealDocument> {
    return this.userMealModel.create({
      userId: new Types.ObjectId(userId),
      name: dto.name,
      imageUrl: dto.imageUrl ?? null,
      eatenAt: new Date(),
      totals: dto.totals,
      items: dto.items,
      language: dto.language ?? null,
      notes: dto.notes ?? "",
    });
  }

  async findInRange(
    userId: string,
    fromIso: string,
    toIso: string,
  ): Promise<UserMealDocument[]> {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    if (!(from < to)) {
      throw new BadRequestException("`from` must be earlier than `to`");
    }

    return this.userMealModel
      .find({
        userId: new Types.ObjectId(userId),
        eatenAt: { $gte: from, $lt: to },
      })
      .sort({ eatenAt: -1 })
      .exec();
  }
}
