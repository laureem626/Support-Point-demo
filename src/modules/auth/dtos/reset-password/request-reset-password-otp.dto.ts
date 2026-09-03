import { IsNotEmpty, IsString, Matches } from 'class-validator';
export class RequestResetPasswordOtpDto {
  @IsString()
  @Matches(/^\d{9,12}$/, { message: 'Mobile number must be 9-12 digits.' })
  @IsNotEmpty()
  mobile: string;
}
