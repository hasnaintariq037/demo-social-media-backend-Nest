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
  @UseGuards(AuthGuard)
  @Put()
  async updateProfile(
    @Body() requestBody: UpdateProfileDto,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File
  ) {
    const result = await this.userService.updateProfile(requestBody, req, file);
    return {
      succeeded: true,
      message: "Profile updted successfully",
      data: result,
    };
  }

  @UseGuards(AuthGuard)
  @Post(":targetUserId")
  async followUser(@Param("targetUserId") targetUser, @Req() req: Request) {
    const { message } = await this.userService.followUser(targetUser, req);
    return { succeeded: true, message };
  }

  @UseGuards(AuthGuard)
  @Get()
  async searchUser(@Query("name") name: string) {
    const users = await this.userService.searchUsers(name);
    return {
      succeeded: true,
      message: "users list fetched successfully",
      data: users,
    };
  }
}
