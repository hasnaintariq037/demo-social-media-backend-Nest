import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtServiceService {
  constructor(private jwtService: JwtService) {}

  async signIn(_id: string): Promise<{ access_token: string }> {
    const payload = { sub: _id };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
