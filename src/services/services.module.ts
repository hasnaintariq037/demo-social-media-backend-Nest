import { Module } from "@nestjs/common";
import { JwtServiceService } from "./jwt-service/jwt-service.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

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
  providers: [JwtServiceService],
  exports: [JwtServiceService],
})
export class ServicesModule {}
