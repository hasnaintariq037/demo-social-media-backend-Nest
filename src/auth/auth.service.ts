import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { RegisterDTO } from "./dto/register.dto";
import { UserService } from "src/user/user.service";

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async regsiterUser(requestData: RegisterDTO) {
    const { password } = requestData;
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltOrRounds);
    return this.userService.registerUser({
      ...requestData,
      password: hashedPassword,
    });
  }
}
