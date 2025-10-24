import { IsNotEmpty, MinLength } from "class-validator";

export class ResetPasswordDto {
  @IsNotEmpty()
  @MinLength(6, { message: "Password must be atleast 6 characters long" })
  password: string;
}
