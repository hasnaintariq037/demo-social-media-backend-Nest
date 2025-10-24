import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class LoginDTO {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: "password must be atleast 6 characters long" })
  password: string;
}
