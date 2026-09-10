import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsArray,
  MinLength,
} from 'class-validator';
import { Designation } from '../enums/users.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John', description: 'First name of the user' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name of the user' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '0712345678', description: 'Mobile number' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: 'NewSecurePassword123!', description: 'Optional new password' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    enum: Designation,
    enumName: 'Designation',
    isArray: true,
    description: 'Update designations for the user',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsEnum(Designation, { each: true })
  designations?: Designation[];

  @ApiPropertyOptional({ example: true, description: 'Active status of the user' })
  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }) => {
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return value;
    },
    { toClassOnly: true },
  )
  isActive?: boolean;
}