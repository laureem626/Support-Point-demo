import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { IsUnique } from '../../../common/validators/is-unique.validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 20)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 20)
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 20)
  designation!: string;

  @IsString()
  @Matches(/^\d{10,12}$/, { message: 'Mobile number must be 12 digits.' })
  @IsNotEmpty()
  @IsUnique('users_user')
  mobile!: string;

  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  password: string;
}
