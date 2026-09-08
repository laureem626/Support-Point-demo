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
  inProgress: IssueInProgressDto;

  @ApiProperty({ example: 45 })
  closed: number;
}

export class DashboardResponseDto {
  @ApiProperty({ example: 120, description: 'Total number of active users' })
  numberOfUsers: number;

  @ApiProperty({ example: 50, description: 'Total number of active products' })
  numberOfProducts: number;

  @ApiProperty({ example: 8, description: 'Total number of active companies' })
  numberOfCompanies: number;

  @ApiProperty({ type: IssuesDto })
  issues: IssuesDto;
}