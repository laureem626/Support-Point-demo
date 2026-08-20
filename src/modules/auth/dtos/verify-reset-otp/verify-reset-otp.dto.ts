import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyResetOtpDto {
  @IsString()
  @Matches(/^\d{10,12}$/, { message: 'Mobile number must be 10-12 digits.' })
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
