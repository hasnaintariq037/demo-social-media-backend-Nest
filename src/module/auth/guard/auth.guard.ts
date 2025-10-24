import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtServiceService } from "src/services/jwt-service/jwt-service.service";
import { UserService } from "src/module/user/user.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtServiceService,
    private readonly userService: UserService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = request.cookies.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      const decoded = await this.jwtService.verifyToken(accessToken);
      const user = await this.userService.findUserById(decoded.sub);
      if (!user) throw new UnauthorizedException("User not found");
      request.user = user;
      return true;
    } catch (err) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
