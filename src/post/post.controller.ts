import {
  Body,
  Controller,
  Delete,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { CreatePostDTO } from "./dto/createPost.dto";
import { PostService } from "./post.service";
import { AuthGuard } from "src/auth/guard/auth.guard";
import type { Request } from "express";
import { FilesInterceptor } from "@nestjs/platform-express";
import multer from "multer";
import { SharePostDTO } from "./dto/sharePost.dto";

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
  @Post("create-post")
  async createPost(
    @Body() requestBody: CreatePostDTO,
    @Req() req: Request,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      const createdPost = await this.postService.createPost(
        requestBody,
        req,
        files
      );
      return {
        succeeded: true,
        message: "Post created successfully",
        data: createdPost,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message || "Registration failed",
          succeeded: false,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(AuthGuard)
  @Delete("delete-post/:postId")
  async deletePost(@Param("postId") postId: string, @Req() req: Request) {
    try {
      await this.postService.deletePost(postId, req);
      return {
        succeeded: true,
        message: "Post deleted successfully",
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message || "Registration failed",
          succeeded: false,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(AuthGuard)
  @Post("share-post/:postId")
  async sharePost(
    @Param("postId") postId: string,
    @Body() requestBody: SharePostDTO,
    @Req() req: Request
  ) {
    try {
      const result = await this.postService.sharePost(postId, requestBody, req);
      return {
        succeeded: true,
        message: "Post shared successfully",
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message || "Registration failed",
          succeeded: false,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(AuthGuard)
  @Post("like-post/:postId")
  async likePost(@Param("postId") postId: string, @Req() req: Request) {
    try {
      const { message, updatedPost } = await this.postService.likePost(
        postId,
        req
      );
      return {
        succeeded: true,
        message: `You ${message} the post`,
        data: updatedPost,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message || "Registration failed",
          succeeded: false,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
