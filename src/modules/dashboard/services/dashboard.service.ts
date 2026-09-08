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
      numberOfUsers,
      numberOfProducts,
      numberOfCompanies,
      critical,
      high,
      medium,
      low,
      closed,
    ] = await Promise.all([
      // 1. Active entity counts
      this.userRepository.count({ where: { isActive: true } }),
      this.productRepository.count({ where: { isActive: true } }),
      this.companyRepository.count({ where: { isActive: true } }),

      // 2. In-Progress issues by priority
      this.issueRepository.count({
        where: { status: IssueStatus.IN_PROGRESS, priority: IssuePriority.CRITICAL },
      }),
      this.issueRepository.count({
        where: { status: IssueStatus.IN_PROGRESS, priority: IssuePriority.HIGH },
      }),
      this.issueRepository.count({
        where: { status: IssueStatus.IN_PROGRESS, priority: IssuePriority.MEDIUM },
      }),
      this.issueRepository.count({
        where: { status: IssueStatus.IN_PROGRESS, priority: IssuePriority.LOW },
      }),

      // 3. Closed issues count
      this.issueRepository.count({
        where: { status: IssueStatus.CLOSED },
      }),
    ]);

    return {
      numberOfUsers,
      numberOfProducts,
      numberOfCompanies,
      issues: {
        inProgress: {
          critical,
          high,
          medium,
          low,
        },
        closed,
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