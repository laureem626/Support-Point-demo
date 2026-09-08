import { ApiProperty } from '@nestjs/swagger';

export class IssueInProgressDto {
  @ApiProperty({ example: 5 })
  critical: number;

   @ApiProperty({ example: 5 })
  high: number;

   @ApiProperty({ example: 5 })
  medium: number;

  @ApiProperty({ example: 12 })
  low: number;
}

export class IssuesDto {
  @ApiProperty({ type: IssueInProgressDto })
  'in-progress': IssueInProgressDto;

  @ApiProperty({ example: 45 })
  closed: number;
}

export class DashboardResponseDto {
  @ApiProperty({ example: 120 })
  'number of users': number;

  @ApiProperty({ example: 50 })
  'number of products': number;

  @ApiProperty({ example: 8 })
  'number of companie': number;

  @ApiProperty({ type: IssuesDto })
  issues: IssuesDto;
}