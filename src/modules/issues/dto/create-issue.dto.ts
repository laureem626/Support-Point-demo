import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { IssuePriority, IssueStatus } from '../../../common/enums/issue.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateIssueDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  companyId!: number;

@ApiProperty({ example: 'Anneth Bujashi' })
  @IsString()
  @IsNotEmpty()
  reporterName!: string;

@ApiProperty({ example: '071234567' })
  @IsString()
  @IsNotEmpty()
  reporterMobile!: string;

@ApiProperty({ example: 'low', enum: IssuePriority })
  @IsEnum(IssuePriority)
  priority!: IssuePriority;

@ApiProperty({ example: "2026-08-18T09:30:00Z" })
  @IsDateString()
  reportedAt!: string;

@ApiProperty({ example: "null" })
  @IsOptional()
  @IsString()
  attachment?: string | null;

@ApiProperty({ example: 'AT_SUPPORT', enum: IssueStatus })
  @IsEnum(IssueStatus)
  status!: IssueStatus;

@ApiProperty({ example: 'Issue title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

@ApiProperty({ example: 'Issue description' })
  @IsString()
  @IsNotEmpty()
  description!: string;
}
