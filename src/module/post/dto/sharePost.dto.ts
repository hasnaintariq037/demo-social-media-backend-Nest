import { IsNotEmpty } from "class-validator";

export class SharePostDTO {
  @IsNotEmpty()
  content: string;
}
