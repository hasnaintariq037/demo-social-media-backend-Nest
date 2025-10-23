import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { UpdateProfileDto } from "./dto/updateProfile.dto";
import { UserService } from "./user.service";
import type { Request } from "express";
import { AuthGuard } from "src/auth/guard/auth.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import multer from "multer";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor("profilePicture", {
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
  @Put("update-profile")
  async updateProfile(
    @Body() requestBody: UpdateProfileDto,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File
  ) {
    try {
      const result = await this.userService.updateProfile(
        requestBody,
        req,
        file
      );
      return {
        succeeded: true,
        message: "Profile updted successfully",
        data: result,
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException("email already exists");
      }
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
  @Post("follow-user/:targetUserId")
  async followUser(@Param("targetUserId") targetUser, @Req() req: Request) {
    try {
      const { message, result } = await this.userService.followUser(
        targetUser,
        req
      );
      return { succeeded: true, message: message, data: result };
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
  @Get("search-user")
  async searchUser(@Query("name") name: string) {
    try {
      const users = await this.userService.searchUsers(name);
      return {
        succeeded: true,
        message: "users list fetched successfully",
        data: users,
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
