import { Module } from "@nestjs/common";
import { PostService } from "./post.service";
import { PostController } from "./post.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Post as post, PostSchema } from "./schema/post.schrma";
import { AuthModule } from "src/module/auth/auth.module";
import { UserModule } from "src/module/user/user.module";
import { ServicesModule } from "src/services/services.module";
import { Like, LikeSchema } from "./schema/like.schema";
import { Share, ShareSchema } from "./schema/share.schema";
import { Follower, FollowerSchema } from "../user/schema/follower.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: post.name, schema: PostSchema },
      { name: Like.name, schema: LikeSchema },
      { name: Share.name, schema: ShareSchema },
      { name: Follower.name, schema: FollowerSchema },
    ]),
    AuthModule,
    UserModule,
    ServicesModule,
  ],
  providers: [PostService],
  controllers: [PostController],
})
export class PostModule {}
