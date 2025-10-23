import { IsNotEmpty, MinLength } from "class-validator";

export class resetPasswordDto {
  @IsNotEmpty()
  @MinLength(6, { message: "Password must be atleast 6 characters long" })
  password: string;
}
