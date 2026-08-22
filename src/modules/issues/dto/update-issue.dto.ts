import { IsEnum, IsNotEmpty } from 'class-validator';
import { IssueStatus } from '../../../common/enums/issue.enum';

export class UpdateIssueStatusDto {
  @IsEnum(IssueStatus)
  @IsNotEmpty()
  status: IssueStatus;
}