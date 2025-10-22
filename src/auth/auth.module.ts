import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UserModule } from "src/user/user.module";
import { ServicesModule } from "src/services/services.module";

@Module({
  imports: [UserModule, ServicesModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
