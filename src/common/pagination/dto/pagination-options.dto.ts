import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationOptionsDto {
  @IsOptional()
  @Transform((data) => parseInt(data.value, 10) || 1)
  page?: number = 1;

  @Transform((data) => parseInt(data.value, 10) || 10)
  @IsOptional()
  pageSize?: number = 10;

  @IsEnum(Order)
  @IsOptional()
  readonly order?: Order = Order.ASC;

  @IsOptional()
  @IsString()
  orderBy?: string = 'createdAt';
}
