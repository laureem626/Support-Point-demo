import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { IssuePriority, IssueStatus } from '../../../common/enums/issue.enum';

export class CreateIssueDto {
  @IsInt()
  @IsNotEmpty()
  companyId! : number;

  @IsString()
  @IsNotEmpty()
  reporterName!: string;

  @IsString()
  @IsNotEmpty()
  reporterMobile!: string;

  @IsEnum(IssuePriority)
  priority!: IssuePriority;

  @IsDateString()
  reportedAt!: string;

  @IsOptional()
  @IsString()
  attachment?: string | null;

  @IsEnum(IssueStatus)
  status!: IssueStatus;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}