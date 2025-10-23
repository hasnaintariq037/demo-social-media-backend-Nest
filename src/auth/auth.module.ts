import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UserModule } from "src/user/user.module";
import { ServicesModule } from "src/services/services.module";
import { AuthGuard } from "./guard/auth.guard";

@Module({
  imports: [UserModule, ServicesModule],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController],
  exports: [AuthGuard, ServicesModule],
})
export class AuthModule {}
