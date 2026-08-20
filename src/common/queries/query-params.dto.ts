import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsPositive,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryParamsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  page?: number = 1;

  //Sorting and Ordering
  @IsOptional()
  @IsString()
  orderBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }) => {
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return undefined;
    },
    { toClassOnly: true },
  )
  isActive?: boolean;
}
