import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./schema/user.schema";
import { Model } from "mongoose";
import { JwtServiceService } from "src/services/jwt-service/jwt-service.service";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtServiceService
  ) {}

  async registerUser(userData) {
    try {
      const user = await this.userModel.create(userData);
      const { access_token } = await this.jwtService.signIn(user._id as string);
      return { token: access_token, user };
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException("email already exists");
      }
    }
  }

  async findUserByEmail(email) {
    const user = await this.userModel.findOne({ email });
    return user;
  }
}
