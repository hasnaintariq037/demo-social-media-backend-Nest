import { Module } from "@nestjs/common";
import { PostService } from "./post.service";
import { PostController } from "./post.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Post as post, PostSchema } from "./schema/post.schrma";
import { AuthModule } from "src/auth/auth.module";
import { UserModule } from "src/user/user.module";
import { ServicesModule } from "src/services/services.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: post.name, schema: PostSchema }]),
    AuthModule,
    UserModule,
    ServicesModule,
  ],
  providers: [PostService],
  controllers: [PostController],
})
export class PostModule {}
