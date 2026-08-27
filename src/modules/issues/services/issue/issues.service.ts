import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
import {
  paginate,
  buildPaginationResponse,
} from 'src/common/utils/pagination.utils';
import { instanceToPlain } from 'class-transformer';

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

  //POST AN ISSUE
  async createComment(createCommentDto: CreateCommentDto) {
    const { userId, issueId, comments } = createCommentDto;

    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const comment = this.commentRepository.create({
      issueId: issue.id,
      userId: user.id,
      comments,
    });
    const saved = await this.commentRepository.save(comment);
    const result = await this.commentRepository.findOne({
      where: {
        id: saved.id,
      },
      relations: {
        user: true,
        issue: true,
      },
    });

    return {
      statusCode: 201,
      message: 'Comment created successfully',
      ...instanceToPlain(result),
    };
  }

  //POST /api/issues/assign
  async assignIssue(createAssignmentDto: CreateAssignmentDto) {
    const { issueUuid, userId, description } = createAssignmentDto;

    // Find issue using UUID
    const issue = await this.issueRepository.findOne({
      where: { uuid: issueUuid },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // Find user using userId
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create assignment
    const assignment = this.assignmentRepository.create({
      issueId: issue.id,
      userId: user.id,
      description,
    });

    // Save assignment
    return this.assignmentRepository.save(assignment);
  }

  //GET ALL ISSUES
  async findAll() {
    const issues = await this.issueRepository.find({
      relations: {
        company: {
          product: true,
        },
        createdBy: true,
        updatedBy: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      statusCode: 200,
      message: 'Issues retrieved successfully',
      data: issues,
    };
  }

  //GET ISSUE AND IT DETAILS
  async findByUuid(uuid: string) {
    const issue = await this.issueRepository.findOne({
      where: { uuid },
      relations: {
        comments: true,
        assignments: true,
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

  //UPDATE ISSUE STATUS
  async updateStatusByUuid(uuid: string, updateDto: UpdateIssueStatusDto) {
    const issue = await this.issueRepository.findOne({ where: { uuid } });
    if (!issue) {
      throw new NotFoundException(`Issue with UUID ${uuid} not found`);
    }

    issue.status = updateDto.status;
    await this.issueRepository.save(issue);

    return {
      statusCode: 200,
      message: 'Issue updated successfully',
    };
  }

  //GET /api/issues/assign
  async getAssignments() {
    return this.assignmentRepository.find({
      relations: {
        issue: true,
        user: true,
      },
    });
  }

  //GET /api/issues/assign/:uuid
  async getAssignment(uuid: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { uuid },
      relations: {
        issue: true,
        user: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return assignment;
  }

  //Find my issue
  async findMyIssues(
    userUuid: string,
    searchParams: SearchParams,
  ): Promise<any> {
    const { searchTerm, page, pageSize } = searchParams;

    // Validate user UUID
    if (!isUUID(userUuid)) {
      throw new BadRequestException('Invalid user UUID');
    }

    // Check that the user exists
    const user = await this.userRepository.findOne({
      where: { uuid: userUuid },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Build query
    const query = this.issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.createdBy', 'createdBy')
      .leftJoinAndSelect('issue.updatedBy', 'updatedBy')
      .leftJoinAndSelect('issue.company', 'company')
      .leftJoinAndSelect('company.product', 'product')
      .where('createdBy.uuid = :userUuid', { userUuid });

    // Search
    if (searchTerm) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('CAST(issue.number AS TEXT) ILIKE :searchTerm', {
            searchTerm: `%${searchTerm}%`,
          })
            .orWhere('issue.title ILIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('issue.description ILIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('issue.reporterName ILIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('issue.reporterMobile ILIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('CAST(issue.status AS TEXT) ILIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('CAST(issue.priority AS TEXT) ILIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            });
        }),
      );
    }

    // Latest issues first
    query.orderBy('issue.createdAt', 'DESC');

    // Pagination
    paginate(query, page, pageSize);

    // Execute query
    const [issues, total] = await query.getManyAndCount();

    // Return paginated response
    const formattedIssues = issues.map((issue) => ({
      ...issue,
      number: `ISSUE-${String(issue.id).padStart(4, '0')}`,
    }));

    return buildPaginationResponse(
      formattedIssues,
      total,
      page,
      pageSize,
      '/issues/my-issues',
    );
  }
}
