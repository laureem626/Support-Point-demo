import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Designation } from '../enums/users.enum';
import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsPositive,
  IsBoolean,
} from 'class-validator';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class UserQueryDto {
  @ApiPropertyOptional({
    description: 'General search text',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  pageSize?: number = 10;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  orderBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    enum: Designation,
    enumName: 'Designation',
    description: 'Filter users by designation',
  })
  @IsOptional()
  @IsEnum(Designation)
  designation?: Designation;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
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
