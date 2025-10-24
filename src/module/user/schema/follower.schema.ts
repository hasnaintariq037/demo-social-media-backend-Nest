import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument, Types } from "mongoose";

export type FollowerDocument = HydratedDocument<Follower>;

@Schema({ timestamps: true })
export class Follower extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  followerId: Types.ObjectId;
}

export const FollowerSchema = SchemaFactory.createForClass(Follower);
