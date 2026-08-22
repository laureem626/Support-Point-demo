import { IsString, IsNotEmpty, IsNumber, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Lindi Mwambao' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiPropertyOptional({ example: 'https://sptechnologies.example.com' })
  @IsUrl()
  @IsOptional()
  link?: string;
}