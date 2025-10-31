import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./schema/user.schema";
import mongoose, { Model } from "mongoose";
import { JwtServiceService } from "src/services/jwt-service/jwt-service.service";
import { UpdateProfileDto } from "./dto/updateProfile.dto";
import { Request } from "express";
import { CloudinaryService } from "src/services/cloudinary/cloudinary.service";
import { Follower } from "./schema/follower.schema";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Follower.name) private followerModel: Model<User>,
    private readonly jwtService: JwtServiceService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async registerUser(userData) {
    const user = await this.userModel.create(userData);
    const { access_token } = await this.jwtService.generateAuthToken(
      String(user._id)
    );
    return { token: access_token, user };
  }

  async findUserByEmail(email) {
    const user = await this.userModel.findOne({ email }).select("+password");
    return user;
  }

  async findUserById(id) {
    return await this.userModel.findById(id);
  }

  async findUserByToken(token) {
    const user = await this.userModel.findOne({
      resetToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    return user;
  }

  async updateProfile(
    requestBody: UpdateProfileDto,
    req: Request,
    file: Express.Multer.File
  ) {
    const { name, email, bio } = requestBody;
    const user = req.user;
    if (file) {
      if (user.profilePicture?.includes("cloudinary.com")) {
        const publicId = user.profilePicture.split("/").pop()?.split(".")[0];
        if (publicId)
          await this.cloudinaryService.deleteFromCloudinary(
            `profile_pictures/${publicId}`
          );
      }
      const uploaded = await this.cloudinaryService.uploadToCloudinary(
        file.path,
        "profile_pictures"
      );
      user.profilePicture = uploaded.secure_url;
    }
    user.name = name;
    user.email = email;
    user.bio = bio;
    const updatedUser = await user.save({ validateBeforeSave: false });
    const { password, ...userWithoutPassword } = updatedUser.toObject(); // converting into lain javascript object
    return userWithoutPassword;
  }

  async folllowUser(targetUserId: string, req: Request) {
    const currentUserId = req.user._id;

    if (currentUserId.toString() === targetUserId) {
      throw new BadRequestException("You cannot follow yourself");
    }

    const session = await this.followerModel.db.startSession();
    let message = "";

    try {
      session.startTransaction();

      const targetObjectId = new mongoose.Types.ObjectId(targetUserId);

      const existing = await this.followerModel
        .findOne({
          userId: targetObjectId,
          followerId: currentUserId,
        })
        .session(session);

      if (existing) {
        await this.followerModel.deleteOne({ _id: existing._id }, { session });
        message = "You unfollowed the user";
      } else {
        await this.followerModel.create(
          [{ userId: targetObjectId, followerId: currentUserId }],
          { session }
        );
        message = "You followed the user";
      }

      await session.commitTransaction();
      return { message };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  async searchUsers(name?: string) {
    const filter = name ? { name: { $regex: name, $options: "i" } } : {};
    const users = await this.userModel.find(filter);
    return users;
  }
}
