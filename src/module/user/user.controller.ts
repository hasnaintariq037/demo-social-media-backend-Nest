import {
  Body,
  Controller,
  Get,
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
import { AuthGuard } from "src/module/auth/guard/auth.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import multer from "multer";
import { createResponse } from "src/util/response.util";

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
    return createResponse(result, "Profile updated successfully");
  }

  @UseGuards(AuthGuard)
  @Post(":targetUserId")
  async followUser(@Param("targetUserId") targetUser, @Req() req: Request) {
    const { message } = await this.userService.folllowUser(targetUser, req);
    return createResponse(message);
  }

  @UseGuards(AuthGuard)
  @Get()
  async searchUser(@Query("name") name: string) {
    const users = await this.userService.searchUsers(name);
    return createResponse(users, "users list fetched successfully");
  }

  @UseGuards(AuthGuard)
  @Get(":targetUserId/is-following")
  async isFollowing(
    @Param("targetUserId") targetUserId: string,
    @Req() req: Request
  ) {
    const currentUserId = req.user._id;

    if (currentUserId.toString() === targetUserId) {
      return { isFollowing: false };
    }

    const existing = await this.userService.checkIsFollowing(
      targetUserId,
      currentUserId
    );

    return { isFollowing: !!existing };
  }
}
