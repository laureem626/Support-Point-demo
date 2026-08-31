import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Issue } from '../../entities/issues/issues.entity';
import { CreateIssueDto } from '../../dto/create-issue.dto';
import { UpdateIssueStatusDto } from '../../dto/update-issue.dto';
import { CreateCommentDto } from '../../dto/create-comment.dto';
import { IssueAssignment } from '../../entities/issues/issues-assignment.entity';
import { CreateAssignmentDto } from '../../dto/create.assignment.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { Comment } from '../../entities/issues/comment.entity';
import { Company } from 'src/modules/companies/entities/company.entity';

import { isUUID } from 'class-validator';
import { SearchParams } from 'src/common/utils/searchparams.utils';

import { instanceToPlain } from 'class-transformer';
import { QueryParamsDto } from 'src/common/queries/query-params.dto';
import { PaginationOptionsDto } from 'src/common/pagination/dto/pagination-options.dto';
import { PaginationService } from 'src/common/pagination/pagination-service';
import { validateAndSort } from 'src/common/utils/sort-queryset';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AssignedTo } from 'src/common/enums/issue.enum';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(IssueAssignment)
    private readonly assignmentRepository: Repository<IssueAssignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createIssueDto: CreateIssueDto, user: User) {
    const { companyId, ...issueData } = createIssueDto;

    const company = await this.companyRepository.findOne({
      where: {
        id: companyId,
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const issue = this.issueRepository.create({
      ...issueData,
      attachment: createIssueDto.attachment ?? null,
      company,
      createdBy: user,
      updatedBy: user,
    });

    const saved = await this.issueRepository.save(issue);

    // Load the company relationship after saving
    const result = await this.issueRepository.findOne({
      where: {
        id: saved.id,
      },
      relations: {
        company: true,

        createdBy: true,
        updatedBy: true,
      },
    });

    return {
      statusCode: 201,
      message: 'Issue reported successfully',
      ...instanceToPlain(result),
    };
  }

  //POST A COMMENT WITHIN AN ISSUE
  async createComment(createCommentDto: CreateCommentDto, userUuid: string) {
    const { issueId, comments } = createCommentDto;

    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    const user = await this.userRepository.findOne({
      where: { uuid: userUuid },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const comment = this.commentRepository.create({
      issueId: issue.id,
      createdBy: user,
      comments,
    });
    const saved = await this.commentRepository.save(comment);

    issue.assignedTo = createCommentDto.assignedTo;
    await this.issueRepository.save(issue);

    const result = await this.commentRepository.findOne({
      where: {
        id: saved.id,
      },
      relations: {
        issue: true,
        createdBy: true,
      },
    });

    return {
      statusCode: 201,
      message: 'Comment created successfully',
      ...instanceToPlain(result),
    };
  }

  //GET ALL ISSUES
  async findAll(
    queryParamsDto: QueryParamsDto,
    paginationOptsDto: PaginationOptionsDto,
  ) {
    const {
      search,
      orderBy = 'createdAt',
      sortOrder = 'DESC',
      status,
      priority,
    } = queryParamsDto;

    const queryBuilder = this.issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.company', 'company')
      .leftJoinAndSelect('company.product', 'product')
      .leftJoinAndSelect('issue.createdBy', 'createdBy')
      .leftJoinAndSelect('issue.updatedBy', 'updatedBy');

    // SEARCH
    if (search) {
      queryBuilder.andWhere(
        `(
        issue.title ILIKE :search OR
        issue.description ILIKE :search OR
        issue.reporterName ILIKE :search OR
        issue.reporterMobile ILIKE :search
      )`,
        {
          search: `%${search}%`,
        },
      );
    }

    // FILTER
    if (status) {
      queryBuilder.andWhere('issue.status = :status', {
        status,
      });
    }

    if (priority) {
      queryBuilder.andWhere('issue.priority = :priority', {
        priority,
      });
    }

    // SORT
    queryBuilder.orderBy(
      `issue.${orderBy}`,
      sortOrder === 'ASC' ? 'ASC' : 'DESC',
    );

    // PAGINATION
    const page = paginationOptsDto.page || 1;
    const limit = paginationOptsDto.pageSize || 10;

    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [issues, total] = await queryBuilder.getManyAndCount();

    return {
      data: issues,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  //GET ISSUE AND IT DETAILS
  async findByUuid(uuid: string) {
    const issue = await this.issueRepository.findOne({
      where: { uuid },

      relations: {
        company: {
          product: true,
        },
        createdBy: true,
        updatedBy: true,
        comments: {
          createdBy: true,
        
        },
      },
    });

    if (!issue) {
      throw new NotFoundException(`Issue with UUID ${uuid} not found`);
    }

    return {
      statusCode: 200,
      data: issue,
    };
  }
  //CLOSE ISSUE
  async closeIssue(
    uuid: string,
    updateDto: UpdateIssueStatusDto,
    userUuid: string,
  ) {
    const issue = await this.issueRepository.findOne({ where: { uuid } });
    if (!issue) {
      throw new NotFoundException(`Issue with UUID ${uuid} not found`);
    }

    const user = await this.userRepository.findOne({
      where: { uuid: userUuid },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    issue.closedBy = user;
    issue.status = updateDto.status;
    await this.issueRepository.save(issue);

    return {
      statusCode: 200,
      message: 'Issue closed successfully',
    };
  }

  //Find my issue
  async findMyIssues(
    userUuid: string,
    queryParamsDto: QueryParamsDto,
    paginationOptsDto: PaginationOptionsDto,
  ) {
    const { search, orderBy, sortOrder } = queryParamsDto;

    // Validate UUID
    if (!isUUID(userUuid)) {
      throw new BadRequestException('Invalid user UUID');
    }

    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { uuid: userUuid },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Build query
    const queryBuilder = this.issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.createdBy', 'createdBy')
      .leftJoinAndSelect('issue.updatedBy', 'updatedBy')
      .leftJoinAndSelect('issue.company', 'company')
      .leftJoinAndSelect('company.product', 'product')
      .leftJoinAndSelect('issue.comments', 'comment')
      .where('issue.assignedTo = :assignedTo', {
        assignedTo: user.designation,
      });

    // Search
    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('issue.title ILIKE :search', {
            search: `%${search}%`,
          })
            .orWhere('issue.description ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('issue.reporterName ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('issue.reporterMobile ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('CAST(issue.status AS TEXT) ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('CAST(issue.priority AS TEXT) ILIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

    // Sorting
    await validateAndSort(
      queryBuilder,
      orderBy ?? 'createdAt',
      sortOrder ?? 'DESC',
      'issue',
      [
        'id',
        'title',
        'reporterName',
        'reporterMobile',
        'priority',
        'status',
        'createdAt',
        'updatedAt',
      ],
    );

    // Pagination
    return PaginationService.paginate(queryBuilder, paginationOptsDto);
  }
}
