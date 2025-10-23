import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

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

  async sendMail({ to, subject, html }) {
    await this.transporter.sendMail({
      from: `Demo Social Media - <${this.configService.get<string>("SMTP_USER")}>`,
      to,
      subject,
      html,
    });
  }
}
