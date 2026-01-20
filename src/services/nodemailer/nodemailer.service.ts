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
          subject: "🔐 Reset Your Password - Action Required",
          html: `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; padding: 40px 0; text-align: center;">
    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(90deg, #2563eb, #1e3a8a); padding: 20px;">
        <h2 style="color: #ffffff; margin: 0;">Password Reset Request</h2>
      </div>
      <div style="padding: 30px; text-align: left; color: #333;">
        <p style="font-size: 15px;">Hi there 👋,</p>
        <p style="font-size: 15px;">We received a request to reset your password. Click the button below to create a new one. This link will expire at <strong>${expiryTime}</strong>.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" target="_blank" 
            style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 25px; 
                   border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 15px; 
                   transition: background 0.3s;">
            🔑 Reset Password
          </a>
        </div>

        <p style="font-size: 14px; color: #555;">If you didn’t request this, you can safely ignore this email — your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 13px; color: #888; text-align: center;">
          This link is valid for one-time use only. <br>
          &copy; ${new Date().getFullYear()} Your Company. All rights reserved.
        </p>
      </div>
    </div>
  </div>
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
