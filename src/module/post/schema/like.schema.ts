import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument, Types } from "mongoose";

export type LikeDocument = HydratedDocument<Like>;

@Schema({ timestamps: true })
export class Like extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "Post" })
  postId: Types.ObjectId;
}

export const LikeSchema = SchemaFactory.createForClass(Like);
