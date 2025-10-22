import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { RegisterDTO } from "./dto/register.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/register")
  async register(
    @Body() requestBody: RegisterDTO,
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      const data = await this.authService.regsiterUser(requestBody);

      res.cookie("accessToken", data?.token, {
        httpOnly: true,
      });

      return {
        message: "User registered successfully",
        succeeded: true,
        data: data?.user,
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
