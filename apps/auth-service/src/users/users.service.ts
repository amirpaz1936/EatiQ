import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  GOOGLE_ID_INDEX_NAME,
  Profile,
  ProfileDocument,
  User,
  UserDocument,
} from "@eatiq/db";
import { Model, Types } from "mongoose";

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.replaceLegacyGoogleIdIndex();
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
    return this.userModel.findById(id).exec();
  }

  findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async create(input: {
    email: string;
    passwordHash: string | null;
    name?: string | null;
    googleId?: string | null;
  }): Promise<UserDocument> {
    const user = await this.userModel.create({
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      name: input.name ?? null,
      googleId: input.googleId ?? null,
    });
    await this.ensureProfile(user._id);
    return user;
  }

  async linkGoogleAccount(
    userId: string,
    googleId: string,
    name: string | null,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { googleId, ...(name ? { name } : {}) },
        { new: true },
      )
      .exec();
  }

  private async ensureProfile(userId: Types.ObjectId): Promise<void> {
    try {
      await this.profileModel.create({ userId });
    } catch (err: unknown) {
      if (this.isDuplicateKeyError(err)) return;
      this.logger.error(`Failed to create profile for user ${userId}`, err);
      throw err;
    }
  }

  private async replaceLegacyGoogleIdIndex(): Promise<void> {
    try {
      const indexes = await this.userModel.collection.indexes();
      const existing = indexes.find((i) => i.name === GOOGLE_ID_INDEX_NAME);

      if (existing && !existing.partialFilterExpression) {
        await this.userModel.collection.dropIndex(GOOGLE_ID_INDEX_NAME);
        this.logger.log(
          `dropped legacy sparse ${GOOGLE_ID_INDEX_NAME} index (it collided on googleId: null)`,
        );
      }

      await this.userModel.createIndexes();
    } catch (err) {
      this.logger.error(
        `googleId index migration failed: ${(err as Error).message}`,
      );
    }
  }

  private isDuplicateKeyError(err: unknown): boolean {
    return (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: number }).code === 11000
    );
  }
}
