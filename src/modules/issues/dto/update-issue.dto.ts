import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { IssuePriority } from 'src/common/enums/issue.enum';

export class UpdateIssueDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'ID of the company associated with the issue',
  })
  @IsOptional()
  @IsInt()
  companyId?: number;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Name of the person reporting the issue',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reporterName?: string;

  @ApiPropertyOptional({
    example: '0712345678',
    description: 'Mobile number of the person reporting the issue',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  reporterMobile?: string;

  @ApiPropertyOptional({
    example: IssuePriority.HIGH,
    description: 'Priority of the issue',
    enum: IssuePriority,
  })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional({
    example: 'Unable to access the system',
    description: 'Title of the issue',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({
    example:
      'The user is unable to log into the system using their registered credentials.',
    description: 'Detailed description of the issue',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}