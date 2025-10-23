import { Module } from "@nestjs/common";
import { JwtServiceService } from "./jwt-service/jwt-service.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { NodemailerService } from "./nodemailer/nodemailer.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"), // ✅ from .env
        signOptions: { expiresIn: "7d" },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtServiceService, NodemailerService],
  exports: [JwtServiceService, NodemailerService],
})
export class ServicesModule {}
