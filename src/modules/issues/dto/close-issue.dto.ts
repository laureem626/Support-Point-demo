import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IssueStatus } from 'src/common/enums/issue.enum';

export class CloseIssueDto {
  @ApiPropertyOptional({
    description: 'Optional comment when closing the issue',
    example: 'Issue resolved successfully.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  comment?: string | null;

  @ApiProperty({
  enum: IssueStatus,
  default: IssueStatus.CLOSED,
  example: IssueStatus.CLOSED,
})
@IsEnum(IssueStatus)
@IsNotEmpty()
status: IssueStatus;
  }
