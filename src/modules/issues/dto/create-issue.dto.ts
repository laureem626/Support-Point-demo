import { IssuePriority } from '../../../common/enums/issue.enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
 
} from 'class-validator';

export class CreateIssueDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  companyId!: number;

@ApiProperty({ example: 'Anneth Bujashi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reporterName!: string;

@ApiProperty({ example: '071234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
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
