import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { RegisterDTO } from "./dto/register.dto";
import { AuthService } from "./auth.service";
import { LoginDTO } from "./dto/login.dto";
import { ForgotPasswordDTO } from "./dto/forPassword.dto";
import { ResetPasswordDto } from "./dto/resetPassword.dto";

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

  @Post("/login")
  async login(
    @Body() requestBody: LoginDTO,
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      const data = await this.authService.loginUser(requestBody);

      res.cookie("accessToken", data?.token, {
        httpOnly: true,
      });

      return {
        message: "User logged in successfully",
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

  @Get("/logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("accessToken");
    return {
      succeeded: true,
      message: "User logged out successfully",
    };
  }

  @Post("/forgot-password")
  async forgotPassword(@Body() requestBody: ForgotPasswordDTO) {
    try {
      await this.authService.forgotPassword(requestBody);
      return {
        message: "Password reset link sent to your email",
        succeeded: true,
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

  @Post("/reset-password/:token")
  async resetPassword(
    @Body() requestBody: ResetPasswordDto,
    @Param("token") token: string
  ) {
    try {
      await this.authService.resetPassword(requestBody, token);
      return {
        message: "password updated successfully",
        succeeded: true,
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
