import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { Company } from '../../companies/entities/company.entity';
import { Issue } from '../../issues/entities/issues/issues.entity';
import { DashboardResponseDto } from '../dtos/dashboard-response.dto';
import { IssuePriority, IssueStatus } from 'src/common/enums/issue.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Company) private readonly companyRepository: Repository<Company>,
    @InjectRepository(Issue) private readonly issueRepository: Repository<Issue>,
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
      this.getIssueCount(IssueStatus.IN_PROGRESS, IssuePriority.CRITICAL),
      this.getIssueCount(IssueStatus.IN_PROGRESS, IssuePriority.HIGH),
      this.getIssueCount(IssueStatus.IN_PROGRESS, IssuePriority.MEDIUM),
      this.getIssueCount(IssueStatus.IN_PROGRESS, IssuePriority.LOW),
      this.getIssueCount(IssueStatus.CLOSED),
    ]);

    return {
      numberOfUsers: userCount,
      numberOfProducts: productCount,
      numberOfCompanies: companyCount,
      issues: {
        inProgress: {
          critical: criticalInProgress,
          high: highInProgress,
          medium: mediumInProgress,
          low: lowInProgress,
        },
        closed: closedCount,
      },
    };
  }

  private async getUserCount(): Promise<number> { 
    return this.userRepository.count({
      where: { isActive: true },
    });
  }

  private async getProductCount(): Promise<number> {
    return this.productRepository.count({
      where: { isActive: true },
    }); 
  }

  private async getCompanyCount(): Promise<number> { 
    return this.companyRepository.count({
      where: { isActive: true },
    });
  }

  private async getIssueCount(status: IssueStatus, priority?: IssuePriority): Promise<number> { 
    return this.issueRepository.count({
      where: { status, priority },
    });
  }
}