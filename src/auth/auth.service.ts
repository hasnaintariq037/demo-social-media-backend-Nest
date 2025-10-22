import { BadRequestException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { RegisterDTO } from "./dto/register.dto";
import { UserService } from "src/user/user.service";
import { LoginDTO } from "./dto/login.dto";
import { JwtServiceService } from "src/services/jwt-service/jwt-service.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtServiceService
  ) {}

  async regsiterUser(requestData: RegisterDTO) {
    const { password } = requestData;
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltOrRounds);
    return this.userService.registerUser({
      ...requestData,
      password: hashedPassword,
    });
  }

  async loginUser(requestData: LoginDTO) {
    const isUserExists = await this.userService.findUserByEmail(
      requestData.email as string
    );
    if (!isUserExists) {
      throw new BadRequestException("invalid email or password");
    }
    const isPasswordMatched = await bcrypt.compare(
      requestData.password,
      isUserExists.password
    );
    if (!isPasswordMatched) {
      throw new BadRequestException("invalid email or password");
    }
    const { access_token } = await this.jwtService.signIn(
      isUserExists._id as string
    );
    return { token: access_token, user: isUserExists };
  }
}
