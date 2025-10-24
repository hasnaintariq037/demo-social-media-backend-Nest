import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument, Types } from "mongoose";

export type ShareDocument = HydratedDocument<Share>;

@Schema({ timestamps: true })
export class Share extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: "User" })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: "Post" })
  sharedPostId: Types.ObjectId;
}

export const ShareSchema = SchemaFactory.createForClass(Share);
