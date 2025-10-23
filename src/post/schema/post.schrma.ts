import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument, Types } from "mongoose";

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({ required: true })
  author: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  media: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: "User" }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: "User" }], default: [] })
  shares: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: "Post" })
  originalPost: Types.ObjectId;
}

export const PostSchema = SchemaFactory.createForClass(Post);
