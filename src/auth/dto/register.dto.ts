import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class RegisterDTO {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: "Password must be atleast 6 characters long" })
  password: string;
}
