import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument, Types } from "mongoose";

export type FollowingDocument = HydratedDocument<Following>;

@Schema({ timestamps: true })
export class Following extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  followingId: Types.ObjectId;
}

export const FollowingSchema = SchemaFactory.createForClass(Following);
