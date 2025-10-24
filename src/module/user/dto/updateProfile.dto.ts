import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class UpdateProfileDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(12, { message: "bio must be atleast 12 characters long" })
  bio: string;
}
