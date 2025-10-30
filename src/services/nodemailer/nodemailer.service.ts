import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { EmailTemplateType } from "src/common/enum/email-templates.enum";

@Injectable()
export class NodemailerService {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("SMTP_HOST"),
      port: Number(this.configService.get<string>("SMTP_PORT")),
      auth: {
        user: this.configService.get<string>("SMTP_USER"),
        pass: this.configService.get<string>("SMTP_PASS"),
      },
    });
  }

  private getTemplate(
    type: EmailTemplateType,
    data: Record<string, any>
  ): { subject: string; html: string } {
    switch (type) {
      case EmailTemplateType.PASSWORD_RESET: {
        const { resetUrl, expiryTime } = data;
        return {
          subject: "Password Reset Request",
          html: `
            <p>You requested to reset your password.</p>
            <p>Click below to set a new one. The link expires at <strong>${expiryTime}</strong>.</p>
            <a href="${resetUrl}" target="_self" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 15px;border-radius:6px;text-decoration:none">Reset Password</a>
            <p>If you didn’t request this, please ignore this email.</p>
          `,
        };
      }
      default:
        throw new Error(`Unknown email template type: ${type}`);
    }
  }

  async sendMail(
    to: string,
    type: EmailTemplateType,
    data: Record<string, any> = {}
  ) {
    const { subject, html } = this.getTemplate(type, data);

    await this.transporter.sendMail({
      from: `Demo Social Media <${this.configService.get<string>("SMTP_USER")}>`,
      to,
      subject,
      html,
    });
  }
}
