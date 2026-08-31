import { IssuePriority, IssueStatus } from '../../../common/enums/issue.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
 
} from 'class-validator';

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



@ApiProperty({ example: "null" })
  @IsOptional()
  @IsString()
  attachment?: string | null;

@ApiProperty({ example: 'Issue title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

@ApiProperty({ example: 'Issue description' })
  @IsString()
  @IsNotEmpty()
  description!: string;
}
