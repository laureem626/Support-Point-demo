import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { Company } from '../../companies/entities/company.entity';
import { Issue } from '../../issues/entities/issues/issues.entity';
import { DashboardResponseDto } from '../dtos/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Company) private readonly companyRepository: Repository<Company>,
    @InjectRepository(Issue) private readonly issueRepository: Repository<Issue>
  ) {}

  async getDashboardStats(): Promise<DashboardResponseDto> {

    const [
      userCount,
      productCount,
      companyCount,
      criticalInProgress,
      highInProgress,
      mediumInProgress,
      lowInProgress,
      closedCount,
    ] = await Promise.all([
      this.getUserCount(),
      this.getProductCount(),
      this.getCompanyCount(),
      this.getIssueCount('IN_PROGRESS', 'CRITICAL'),
      this.getIssueCount('IN_PROGRESS', 'HIGH'),
      this.getIssueCount('IN_PROGRESS', 'MEDIUM'),
      this.getIssueCount('IN_PROGRESS', 'LOW'),
      this.getIssueCount('CLOSED'),
    ]);

    return {
      'number of users': userCount,
      'number of products': productCount,
      'number of companie': companyCount,
      issues: {
        'in-progress': {
          critical: criticalInProgress,
            high: highInProgress,
            medium: mediumInProgress,
          low: lowInProgress,
        },
        closed: closedCount,
      },
    };
  }

  // Example placeholder query methods
  private async getUserCount(): Promise<number> { return 120; }
  private async getProductCount(): Promise<number> { return 50; }
  private async getCompanyCount(): Promise<number> { return 8; }
  private async getIssueCount(status: string, priority?: string): Promise<number> { return 5; }
}