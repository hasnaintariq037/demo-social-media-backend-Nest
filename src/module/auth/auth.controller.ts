import { Body, Controller, Param, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { RegisterDTO } from "./dto/register.dto";
import { AuthService } from "./auth.service";
import { LoginDTO } from "./dto/login.dto";
import { ForgotPasswordDTO } from "./dto/forPassword.dto";
import { ResetPasswordDto } from "./dto/resetPassword.dto";
import { createResponse } from "src/util/response.util";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(
    @Body() requestBody: RegisterDTO,
    @Res({ passthrough: true }) res: Response
  ) {
    const data = await this.authService.regsiterUser(requestBody);

    res.cookie("accessToken", data?.token, {
      httpOnly: true,
    });

    return createResponse(data?.user, "User registered successfully");
  }

  @Post("login")
  async login(
    @Body() requestBody: LoginDTO,
    @Res({ passthrough: true }) res: Response
  ) {
    const data = await this.authService.loginUser(requestBody);

    res.cookie("accessToken", data?.token, {
      httpOnly: true,
    });

    return createResponse(data?.user, "User logged in successfully");
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("accessToken");

    return createResponse("user logged out successfully");
  }

  @Post("forgot-password")
  async forgotPassword(@Body() requestBody: ForgotPasswordDTO) {
    await this.authService.forgotPassword(requestBody);

    return createResponse("Password reset link sent to your email");
  }

  @Post("reset-password/:token")
  async resetPassword(
    @Body() requestBody: ResetPasswordDto,
    @Param("token") token: string
  ) {
    await this.authService.resetPassword(requestBody, token);

    return createResponse("passwore updated successfully");
  }
}
