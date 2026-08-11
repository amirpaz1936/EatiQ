import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Profile, ProfileDocument } from "@eatiq/db";
import { Model, Types } from "mongoose";
import type { UpdateProfileDto } from "./dto/update-profile.dto";
import { SuggestionsCacheService } from "../suggestions/suggestions-cache.service";

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    private readonly suggestionsCache: SuggestionsCacheService,
  ) {}

  async get(userId: string): Promise<ProfileDocument> {
    const id = new Types.ObjectId(userId);
    return this.profileModel
      .findOneAndUpdate(
        { userId: id },
        { $setOnInsert: { userId: id } },
        { new: true, upsert: true },
      )
      .exec();
  }

  async update(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileDocument> {
    const id = new Types.ObjectId(userId);
    const updated = await this.profileModel
      .findOneAndUpdate(
        { userId: id },
        { $set: dto, $setOnInsert: { userId: id } },
        { new: true, upsert: true },
      )
      .exec();

    await this.suggestionsCache.invalidateForUser(userId);

    return updated;
  }
}
