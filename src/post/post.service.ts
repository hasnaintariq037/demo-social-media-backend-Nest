import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { CreatePostDTO } from "./dto/createPost.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Post } from "./schema/post.schrma";
import { Model } from "mongoose";
import { Request } from "express";
import { CloudinaryService } from "src/services/cloudinary/cloudinary.service";
import { SharePostDTO } from "./dto/sharePost.dto";

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async createPost(
    requestBody: CreatePostDTO,
    req: Request,
    files: Express.Multer.File[] | undefined
  ) {
    const { content } = requestBody;
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map((file) =>
        this.cloudinaryService.uploadToCloudinary(file.path, "posts")
      );
      const results = await Promise.all(uploadPromises);
      imageUrls = results.map((r) => r.secure_url);
    }
    const createdPost = await this.postModel.create({
      content,
      author: req.user._id,
      media: imageUrls,
    });
    return createdPost;
  }

  async deletePost(postId: string, req: Request) {
    const post = await this.postModel.findOne({ _id: postId });
    if (!post) {
      throw new BadRequestException("Post not found");
    }
    if (post.media && post.media.length > 0) {
      const deletePromises = post.media.map((imgUrl) => {
        // Extract publicId from URL (Cloudinary path)
        const parts = imgUrl.split("/");
        const fileName = parts[parts.length - 1];
        const publicId = `posts/${fileName.split(".")[0]}`;
        return this.cloudinaryService.deleteFromCloudinary(publicId);
      });
      await Promise.all(deletePromises);
    }
    const isOwner = this.checkPostOwner(post.author, req.user._id);
    if (!isOwner) {
      throw new ForbiddenException("You are not owner of this post");
    }
    return await this.postModel.deleteOne({ _id: postId });
  }

  async sharePost(postId: string, requestBody: SharePostDTO, req: Request) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new BadRequestException("Post not found");
    }
    post.shares.push(req.user._id);
    await post.save({ validateBeforeSave: false });
    const sharedPost = await this.postModel.create({
      media: [],
      likes: [],
      shares: [],
      content: requestBody.content,
      originalPost: post._id,
      author: req.user._id,
    });
    return sharedPost;
  }

  async likePost(postId: string, req: Request) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new BadRequestException("Post not found");
    }
    post.likes = post.likes || [];

    let message = "";
    const userId = req.user._id;

    if (post.likes.some((id) => id.equals(userId))) {
      // User already liked → unlike
      post.likes = post.likes.filter((id) => !id.equals(userId));
      message = "Unliked";
    } else {
      // Like the post
      post.likes.push(userId);
      message = "Liked";
    }

    const updatedPost = await post.save({ validateBeforeSave: false });

    return {
      message,
      updatedPost,
    };
  }

  async getAllPosts(req: Request) {
    const { isMostLikedPosts, isFollowingPosts, isMostSharedPosts } = req.query;
    let pipeline: any[] = [];
    if (isFollowingPosts === "true") {
      pipeline.push({
        $match: { author: { $in: req.user.following || [] } },
      });
    }
    // Add counts for likes and shares
    pipeline.push({
      $addFields: {
        likesCount: { $size: { $ifNull: ["$likes", []] } },
        sharesCount: { $size: { $ifNull: ["$shares", []] } },
      },
    });

    if (isMostLikedPosts) {
      pipeline.push({ $match: { likesCount: { $gt: 0 } } });
      pipeline.push({ $sort: { likesCount: -1, createdAt: -1 } });
    }

    if (isMostSharedPosts) {
      pipeline.push({ $match: { sharesCount: { $gt: 0 } } });
      pipeline.push({ $sort: { sharesCount: -1, createdAt: -1 } });
    }

    if (!isMostLikedPosts && !isMostSharedPosts) {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Populate author
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author",
      },
    });
    pipeline.push({ $unwind: "$author" });

    // Populate original post and its author
    pipeline.push({
      $lookup: {
        from: "posts",
        localField: "originalPost",
        foreignField: "_id",
        as: "originalPost",
      },
    });
    pipeline.push({
      $unwind: { path: "$originalPost", preserveNullAndEmptyArrays: true },
    });
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "originalPost.author",
        foreignField: "_id",
        as: "originalPost.author",
      },
    });

    const posts = await this.postModel.aggregate(pipeline);
    return posts;
  }

  private checkPostOwner(author, userId) {
    if (author.equals(userId)) {
      return true;
    } else {
      return false;
    }
  }
}
