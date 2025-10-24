import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { CreatePostDTO } from "./dto/createPost.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Post } from "./schema/post.schrma";
import mongoose, { Model } from "mongoose";
import { Request } from "express";
import { CloudinaryService } from "src/services/cloudinary/cloudinary.service";
import { SharePostDTO } from "./dto/sharePost.dto";
import { Like } from "./schema/like.schema";
import { Share } from "./schema/share.schema";

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Like.name) private likeModel: Model<Like>,
    @InjectModel(Share.name) private shareModel: Model<Share>,
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
      imageUrls = await this.cloudinaryService.uploadMultiple(files, "posts");
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

    const isOwner = this.checkPostOwner(post.author, req.user._id);
    if (!isOwner) {
      throw new ForbiddenException("You are not the owner of this post");
    }

    if (post.media?.length) {
      await this.cloudinaryService.deleteMultiple(post.media);
    }
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      await Promise.all([
        this.likeModel.deleteMany({
          postId: new mongoose.Types.ObjectId(postId),
        }),
        this.shareModel.deleteMany({
          sharedPostId: new mongoose.Types.ObjectId(postId),
        }),
        this.postModel.deleteMany({
          $or: [
            { _id: postId },
            { originalPost: new mongoose.Types.ObjectId(postId) },
          ],
        }),
      ]);
      await session.commitTransaction();
      return { message: "Post and related likes deleted successfully" };
    } finally {
      await session.endSession();
    }
  }

  async sharePost(postId: string, requestBody: SharePostDTO, req: Request) {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new BadRequestException("Post not found");
    }
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const [sharedPost] = await Promise.all([
        await this.postModel.create({
          media: [],
          content: requestBody.content,
          originalPost: post._id,
          author: req.user._id,
        }),
        this.shareModel.create({
          sharedPostId: post._id,
          userId: req.user._id,
        }),
      ]);
      await session.commitTransaction();
      return sharedPost;
    } finally {
      await session.endSession();
    }
  }

  async likePost(postId: string, req: Request) {
    let message = "";
    const userId = req.user._id;
    const isAlreadyliked = await this.likeModel.findOne({
      postId: new mongoose.Types.ObjectId(postId),
    });
    if (isAlreadyliked) {
      await this.likeModel.deleteOne({ _id: isAlreadyliked._id });
      message = "Unliked";
    } else {
      await this.likeModel.create({
        postId: new mongoose.Types.ObjectId(postId),
        userId: userId,
      });
      message = "Liked";
    }
    return message;
  }

  async getAllPosts(req: Request) {
    const { isMostLikedPosts, isFollowingPosts, isMostSharedPosts } = req.query;
    const user = req.user;
    const pipeline: any[] = [];

    if (isFollowingPosts === "true" && user?.following?.length) {
      pipeline.push({
        $match: { author: { $in: user.following } },
      });
    }

    pipeline.push({
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "postId",
        as: "likesData",
        pipeline: [{ $project: { _id: 1 } }],
      },
    });

    pipeline.push({
      $lookup: {
        from: "shares",
        localField: "_id",
        foreignField: "sharedPostId",
        as: "sharesData",
        pipeline: [{ $project: { _id: 1 } }],
      },
    });

    pipeline.push({
      $addFields: {
        likesCount: { $size: { $ifNull: ["$likesData", []] } },
        sharesCount: { $size: { $ifNull: ["$sharesData", []] } },
      },
    });

    if (isMostLikedPosts === "true") {
      pipeline.push({ $match: { likesCount: { $gt: 0 } } });
      pipeline.push({ $sort: { likesCount: -1, createdAt: -1 } });
    } else if (isMostSharedPosts === "true") {
      pipeline.push({ $match: { sharesCount: { $gt: 0 } } });
      pipeline.push({ $sort: { sharesCount: -1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push({
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author",
        pipeline: [{ $project: { _id: 1, name: 1, profilePicture: 1 } }],
      },
    });
    pipeline.push({ $unwind: "$author" });

    pipeline.push({
      $lookup: {
        from: "posts",
        localField: "originalPost",
        foreignField: "_id",
        as: "originalPost",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
              pipeline: [{ $project: { _id: 1, name: 1, profilePicture: 1 } }],
            },
          },
          { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              content: 1,
              media: 1,
              createdAt: 1,
              author: 1,
            },
          },
        ],
      },
    });
    pipeline.push({
      $unwind: { path: "$originalPost", preserveNullAndEmptyArrays: true },
    });

    pipeline.push({
      $project: {
        "author.password": 0,
        "originalPost.author.password": 0,
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
