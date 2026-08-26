import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Support Point Pro' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'A complete support platform for growing teams.',
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiPropertyOptional({ example: 'https://supportpoint.example.com' })
  @IsUrl()
  @IsOptional()
  link: string;
}