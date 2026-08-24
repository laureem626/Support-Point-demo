import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { IsUnique } from '../../../common/validators/is-unique.validator';
import { ApiProperty } from '@nestjs/swagger';
import { Designation } from 'src/common/enums/issue.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 20)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 20)
  lastName!: string;

  @ApiProperty({ example: 'AT_SUPPORTER', enum: Designation })
  @IsEnum(Designation)
  designation!: Designation;

  @ApiProperty({ example: '987654321012' })
  @IsString()
  @Matches(/^\d{10,12}$/, { message: 'Mobile number must be 12 digits.' })
  @IsNotEmpty()
  @IsUnique('users_user')
  mobile!: string;

  @ApiProperty({ example: 'Password123!' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  password: string;
}
