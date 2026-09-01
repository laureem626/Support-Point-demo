import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CloseIssueDto {
  @ApiPropertyOptional({
    description: 'Optional comment when closing the issue',
    example: 'Issue resolved successfully.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  comment?: string | null;
}