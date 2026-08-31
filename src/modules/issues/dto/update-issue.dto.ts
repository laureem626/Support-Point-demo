import { IsEnum, IsNotEmpty } from 'class-validator';
import { IssueStatus } from '../../../common/enums/issue.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateIssueStatusDto {
  @ApiProperty({ enum: IssueStatus })
  @IsEnum(IssueStatus)
  @IsNotEmpty()
  status: IssueStatus;
}