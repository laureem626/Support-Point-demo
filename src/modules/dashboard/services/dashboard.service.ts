import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { Company } from '../../companies/entities/company.entity';
import { Issue } from '../../issues/entities/issues/issues.entity';
import { IssuePriority, IssueStatus } from 'src/common/enums/issue.enum';
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Company) private readonly companyRepository: Repository<Company>,
    @InjectRepository(Issue) private readonly issueRepository: Repository<Issue>,
  ) {}

  async getDashboardStats() {
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
      // Active entity counts
      this.userRepository.count({ where: { isActive: true } }),
      this.productRepository.count({ where: { isActive: true } }),
      this.companyRepository.count({ where: { isActive: true } }),

      // In-Progress issues by priority
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

      // Closed issues count
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
}