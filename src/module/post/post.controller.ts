import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { CreatePostDTO } from "./dto/createPost.dto";
import { PostService } from "./post.service";
import { AuthGuard } from "src/module/auth/guard/auth.guard";
import type { Request } from "express";
import { FilesInterceptor } from "@nestjs/platform-express";
import multer from "multer";
import { SharePostDTO } from "./dto/sharePost.dto";
import { createResponse } from "src/util/response.util";

@Controller("post")
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(AuthGuard)
  @UseInterceptors(
    FilesInterceptor("images", 5, {
      storage: multer.diskStorage({
        filename: (
          req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, destination: string) => void
        ) => {
          cb(null, Date.now() + "-" + file.originalname);
        },
      }),
    })
  )
  @Post()
  async createPost(
    @Body() requestBody: CreatePostDTO,
    @Req() req: Request,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const createdPost = await this.postService.createPost(
      requestBody,
      req,
      files
    );
    return createResponse(createdPost, "Post created successfully");
  }

  @UseGuards(AuthGuard)
  @Delete(":postId")
  async deletePost(@Param("postId") postId: string, @Req() req: Request) {
    await this.postService.deletePost(postId, req);
    return createResponse("Post deleted successfully");
  }

  @UseGuards(AuthGuard)
  @Post("share-post/:postId")
  async sharePost(
    @Param("postId") postId: string,
    @Body() requestBody: SharePostDTO,
    @Req() req: Request
  ) {
    const result = await this.postService.sharePost(postId, requestBody, req);
    return createResponse("Post shared successfully");
  }

  @UseGuards(AuthGuard)
  @Post("like-post/:postId")
  async likePost(@Param("postId") postId: string, @Req() req: Request) {
    const message = await this.postService.likePost(postId, req);
    return createResponse(`You ${message} the post`);
  }

  @UseGuards(AuthGuard)
  @Get()
  async getAllPosts(@Req() req) {
    const posts = await this.postService.getAllPosts(req);
    return createResponse(posts, "Posts fetched successfully");
  }
}
