import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Profile, ProfileSchema, User, UserSchema } from "@eatiq/db";
import { UsersService } from "./users.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
    ]),
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
