import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./schema/user.schema";
import mongoose, { Model } from "mongoose";
import { JwtServiceService } from "src/services/jwt-service/jwt-service.service";
import { UpdateProfileDto } from "./dto/updateProfile.dto";
import { Request } from "express";
import { CloudinaryService } from "src/services/cloudinary/cloudinary.service";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtServiceService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async registerUser(userData) {
    try {
      const user = await this.userModel.create(userData);
      const { access_token } = await this.jwtService.signIn(String(user._id));
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

  async followUser(targetUserId, req: Request) {
    // Convert current user ID to ObjectId
    const currentUserId = new mongoose.Types.ObjectId(req.user._id as string);
    let currentUser = req.user;

    if (currentUserId.equals(targetUserId)) {
      throw new BadRequestException("You cannot follow yourself");
    }

    const targetUser = await this.userModel.findById(targetUserId);
    if (!targetUser)
      throw new BadRequestException("You cannot follow yourself");

    // Initialize arrays if undefined
    targetUser.followers = targetUser.followers || [];
    currentUser.following = currentUser.following || [];

    const alreadyFollowing = targetUser.followers.some((f) =>
      f.equals(currentUserId)
    );

    if (alreadyFollowing) {
      // UNFOLLOW
      targetUser.followers = targetUser.followers.filter(
        (f) => !f.equals(currentUserId)
      );
      currentUser.following = currentUser.following.filter(
        (f) => !f.equals(targetUserId)
      );

      await targetUser.save({ validateBeforeSave: false });
      const result = await currentUser.save({ validateBeforeSave: false });

      return { result, message: `You unfollow ${targetUser?.name}` };
    } else {
      // FOLLOW
      targetUser.followers.push(currentUserId);
      currentUser.following.push(new mongoose.Types.ObjectId(targetUserId));

      await targetUser.save({ validateBeforeSave: false });
      const result = await currentUser.save({ validateBeforeSave: false });

      return { result, message: `You follow ${targetUser?.name}` };
    }
  }

  async searchUsers(name) {
    const users = await this.userModel.find({
      name: { $regex: name, $options: "i" },
    });
    return users;
  }
}
