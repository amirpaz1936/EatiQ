import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserMeal, UserMealDocument } from "@eatiq/db";
import { Model, Types } from "mongoose";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { CreateMealDto } from "./dto/create-meal.dto";
import { S3ClientProvider } from "../image-recognition/s3.client";

const IMAGE_PRESIGN_EXPIRES_SECONDS = 15 * 60;

@Injectable()
export class MealsService {
  constructor(
    @InjectModel(UserMeal.name)
    private readonly userMealModel: Model<UserMealDocument>,
    private readonly s3: S3ClientProvider,
  ) {}

  async create(userId: string, dto: CreateMealDto): Promise<UserMealDocument> {
    return this.userMealModel.create({
      userId: new Types.ObjectId(userId),
      name: dto.name,
      imageUrl: dto.imageUrl ?? null,
      imageObjectKey: this.ownedKeyOrNull(userId, dto.imageObjectKey),
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

  async presignImage(userId: string, mealId: string): Promise<string> {
    if (!Types.ObjectId.isValid(mealId)) {
      throw new NotFoundException("Meal not found");
    }

    const meal = await this.userMealModel
      .findById(mealId, { userId: 1, imageObjectKey: 1 })
      .lean()
      .exec();

    if (!meal) throw new NotFoundException("Meal not found");
    if (String(meal.userId) !== userId) {
      throw new ForbiddenException("Meal does not belong to this user");
    }
    if (!meal.imageObjectKey) {
      throw new NotFoundException("Meal has no photo");
    }

    const command = new GetObjectCommand({
      Bucket: this.s3.bucket,
      Key: meal.imageObjectKey,
    });
    return getSignedUrl(this.s3.publicClient, command, {
      expiresIn: IMAGE_PRESIGN_EXPIRES_SECONDS,
    });
  }

  private ownedKeyOrNull(
    userId: string,
    objectKey: string | null | undefined,
  ): string | null {
    if (!objectKey) return null;
    return objectKey.startsWith(`users/${userId}/`) ? objectKey : null;
  }
}
