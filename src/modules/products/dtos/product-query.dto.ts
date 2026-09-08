import { Type} from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsPositive,
  
} from 'class-validator';
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
export class ProductQueryDto {
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
  example: SortOrder.ASC,
  default: SortOrder.ASC,
})
@IsOptional()
@IsEnum(SortOrder)
sortOrder?: SortOrder = SortOrder.ASC;
  
 
  
 

  
  
}