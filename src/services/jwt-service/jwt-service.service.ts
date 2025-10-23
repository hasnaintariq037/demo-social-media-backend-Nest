import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtServiceService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async signIn(_id: string): Promise<{ access_token: string }> {
    const payload = { sub: _id };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async verifyToken(token) {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>("JWT_SECRET"),
    });
    return payload;
  }
}
