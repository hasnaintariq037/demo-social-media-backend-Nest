import { BadRequestException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { RegisterDTO } from "./dto/register.dto";
import { LoginDTO } from "./dto/login.dto";
import { ForgotPasswordDTO } from "./dto/forPassword.dto";
import { UserService } from "src/user/user.service";
import { JwtServiceService } from "src/services/jwt-service/jwt-service.service";
import { NodemailerService } from "src/services/nodemailer/nodemailer.service";
import { ResetPasswordDto } from "./dto/resetPassword.dto";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtServiceService,
    private readonly nodeMailerService: NodemailerService,
    private readonly configservice: ConfigService
  ) {}

  /** Register new user */
  async regsiterUser(requestData: RegisterDTO) {
    const saltOrRounds = Number(this.configservice.get<number>("SALT_ROUNDS"));
    const hashedPassword = await bcrypt.hash(
      requestData.password,
      saltOrRounds
    );

    return this.userService.registerUser({
      ...requestData,
      password: hashedPassword,
    });
  }

  /** Login user */
  async loginUser(
    requestData: LoginDTO
  ): Promise<{ token: string; user: any }> {
    const user = await this.userService.findUserByEmail(requestData.email);

    if (!user || !(await bcrypt.compare(requestData.password, user.password))) {
      throw new BadRequestException("Invalid email or password");
    }

    const { access_token } = await this.jwtService.generateAuthToken(
      String(user._id)
    );
    return {
      token: access_token,
      user: { ...(user.toObject?.() ?? user), password: undefined },
    };
  }

  /** Forgot Password - Send Reset Email */
  async forgotPassword(requestData: ForgotPasswordDTO) {
    const user = await this.userService.findUserByEmail(requestData.email);

    if (!user) {
      throw new BadRequestException("Email does not exist");
    }

    // Generate secure reset token and expiry
    const { plainToken, hashedToken, expiresAt } = this.generateResetToken();

    // Save token info in user document
    user.resetToken = hashedToken;
    user.resetPasswordExpires = expiresAt;
    await user.save({ validateBeforeSave: false });

    // Create reset link
    const resetUrl = `${this.configservice.get<string>("FRONTEND_URL")}/reset-password/${plainToken}`;
    const expiryTime = expiresAt.toLocaleTimeString();

    const resetTemplate = `
      <p>You requested to reset your password.</p>
      <p>Click below to set a new one. The link expires at <strong>${expiryTime}</strong>.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 15px;border-radius:6px;text-decoration:none">Reset Password</a>
      <p>If you didn’t request this, please ignore this email.</p>
    `;

    // Send reset email
    await this.nodeMailerService.sendMail({
      to: user.email,
      subject: "Password Reset Request",
      html: resetTemplate,
    });

    return { message: "Reset password email sent successfully" };
  }

  async resetPassword(requestData: ResetPasswordDto, token: string) {
    const { password } = requestData;
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await this.userService.findUserByToken(resetPasswordToken);
    if (!user) throw new BadRequestException("Invalid or expired token");

    user.password = password;
    user.resetToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return true;
  }

  /** Utility: Generate Secure Reset Token */
  private generateResetToken(): {
    plainToken: string;
    hashedToken: string;
    expiresAt: Date;
  } {
    const plainToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 15 minutes

    return { plainToken, hashedToken, expiresAt };
  }
}
