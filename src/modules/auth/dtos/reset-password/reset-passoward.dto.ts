import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  resetToken: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'new password must be at least 6 characters long.' })
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, {
    message: 'confirm password must be at least 6 characters long.',
  })
  confirmPassword: string;
}
