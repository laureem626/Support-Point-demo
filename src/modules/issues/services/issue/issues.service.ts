import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Issue } from '../../entities/issues/issues.entity';
import { CreateIssueDto } from '../../dto/create-issue.dto';
import { UpdateIssueStatusDto } from '../../dto/update-issue.dto';
import { CloseIssueDto } from '../../dto/close-issue.dto';
import { CreateCommentDto } from '../../dto/create-comment.dto';
import { IssueAssignment } from '../../entities/issues/issues-assignment.entity';
import { CreateAssignmentDto } from '../../dto/create.assignment.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { Comment } from '../../entities/issues/comment.entity';
import { Company } from 'src/modules/companies/entities/company.entity';

import { isUUID } from 'class-validator';
import { SearchParams } from 'src/common/utils/searchparams.utils';

import { instanceToPlain } from 'class-transformer';

import { PaginationOptionsDto } from 'src/common/pagination/dto/pagination-options.dto';
import { PaginationService } from 'src/common/pagination/pagination-service';
import { validateAndSort } from 'src/common/utils/sort-queryset';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AssignedTo, Designation, IssueStatus } from 'src/common/enums/issue.enum';
import { QueryParamsDto } from 'src/common/queries/query-params.dto';


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
    const { issueId, assignedId, comments } = createCommentDto;

    const issue = await this.issueRepository.findOne({
      where: { id: issueId },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    if (issue.status === IssueStatus.CLOSED) {
  throw new BadRequestException(
    'Cannot assign a closed issue',
  );
}

    const currentUser = await this.userRepository.findOne({
    where: { uuid: userUuid },
  });

  if (!currentUser) {
    throw new NotFoundException('Current user not found');
  }

    const assignedUser = await this.userRepository.findOne({
  where: { id: assignedId },
});
if (!assignedUser) {
  throw new NotFoundException('Assigned user not found');
}
 
 const lastAssignment = await this.commentRepository
    .createQueryBuilder('comment')
    .where('comment.issueId = :issueId', {
      issueId,
    })
    .andWhere('comment.assignedTo IS NOT NULL')
    .orderBy('comment.createdAt', 'DESC')
    .getOne();

 await this.validateAssignment(
    currentUser,
    assignedUser,
    lastAssignment,
  );

    const comment = this.commentRepository.create({
      issueId: issue.id,
      createdBy: currentUser,
      assignedTo:assignedUser.id,
      comments,
    });
    const saved = await this.commentRepository.save(comment);

  

    const result = await this.commentRepository.findOne({
      where: {
        id: saved.id,
      },
      relations: {
        issue: true,
        createdBy: true,
        assignedUser: true, 
      },
    });

    return {
      statusCode: 201,
      message: 'Comment created successfully',
      ...instanceToPlain(result),
    };
  }

  private async validateAssignment(
  currentUser: User,
  assignedUser: User,
  lastAssignment: Comment | null,
) {
  const currentDesignation = currentUser.designation;
  const assignedDesignation = assignedUser.designation;

   if (
    lastAssignment &&
    lastAssignment.assignedTo === assignedUser.id
  ) {
    throw new BadRequestException(
      'This issue is already assigned to this user',
    );
  }

  if (
  currentDesignation === Designation.SUPPORTER &&
  assignedDesignation === Designation.BA
) {
  return;
}
  

  // No previous assignment
  if (!lastAssignment) {
    if (
      currentDesignation === Designation.SUPPORTER &&
      assignedDesignation === Designation.BA
    ) {
      return;
    }

    throw new BadRequestException(
      `${currentDesignation} cannot assign this issue to ${assignedDesignation}.`,
    );
  }

  // Who currently owns the issue?
  const currentAssigneeId = lastAssignment.assignedTo;

  // The person making the assignment MUST currently own the issue
  if (currentAssigneeId !== currentUser.id) {
    throw new BadRequestException(
      'You cannot assign this issue because it is not currently assigned to you.',
    );
  }

  // -----------------------------------------
  // SUPPORTER → BA
  // -----------------------------------------
  if (
    currentDesignation === Designation.SUPPORTER &&
    assignedDesignation === Designation.BA
  ) {
    return;
  }

  // -----------------------------------------
  // BA → DEVELOPER
  // -----------------------------------------
  if (
    currentDesignation === Designation.BA &&
    assignedDesignation === Designation.DEVS
  ) {
    return;
  }

  // -----------------------------------------
  // BA → SUPPORTER
  // Only if Supporter previously assigned
  // this issue to this BA
  // -----------------------------------------
  if (
    currentDesignation === Designation.BA &&
    assignedDesignation === Designation.SUPPORTER
  ) {
    const previousSupporterAssignment =
      await this.commentRepository
        .createQueryBuilder('comment')
        .innerJoin(
          'comment.createdBy',
          'creator',
        )
        .where('comment.issueId = :issueId', {
          issueId: lastAssignment.issueId,
        })
        .andWhere(
          'comment.assignedTo = :baId',
          {
            baId: currentUser.id,
          },
        )
        .andWhere(
          'creator.designation = :designation',
          {
            designation: Designation.SUPPORTER,
          },
        )
        .getOne();

    if (!previousSupporterAssignment) {
      throw new BadRequestException(
        'BA can only assign to a Supporter if a Supporter previously assigned this issue to the BA.',
      );
    }

    return;
  }

  // -----------------------------------------
  // DEVELOPER → QA ONLY
  // -----------------------------------------
  if (
    currentDesignation === Designation.DEVS &&
    assignedDesignation === Designation.QA
  ) {
    return;
  }

  // Developer cannot assign anywhere else
  if (
    currentDesignation === Designation.DEVS
  ) {
    throw new BadRequestException(
      'Developer can only assign an issue to QA.',
    );
  }

  // -----------------------------------------
  // QA → DEVELOPER
  // -----------------------------------------
  if (
    currentDesignation === Designation.QA&&
    assignedDesignation === Designation.DEVS
  ) {
    return;
  }

  // -----------------------------------------
  // QA → SUPPORTER
  // -----------------------------------------
  if (
    currentDesignation === Designation.QA&&
    assignedDesignation === Designation.SUPPORTER
  ) {
    return;
  }

  // -----------------------------------------
  // Everything else is forbidden
  // -----------------------------------------
  throw new BadRequestException(
    `${currentDesignation} cannot assign an issue to ${assignedDesignation}.`,
  );
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
  
            const data = await Promise.all(
    issues.map(async (issue) => {
      const lastAssignment = await this.commentRepository
        .createQueryBuilder('comment')
        .leftJoinAndSelect(
          'comment.assignedUser',
          'assignedUser',
        )
        .where('comment.issueId = :issueId', {
          issueId: issue.id,
        })
        .andWhere('comment.assignedTo IS NOT NULL')
        .orderBy('comment.createdAt', 'DESC')
        .getOne();

        return {
      ...instanceToPlain(issue),
      currentAssignee: lastAssignment?.assignedUser ?? null,
    };
      }))


    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    } ;
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
          assignedUser: true,
        },
      },
    });

    if (!issue) {
      throw new NotFoundException(`Issue with UUID ${uuid} not found`);
    }

    const lastAssignment = await this.commentRepository
    .createQueryBuilder('comment')
    .leftJoinAndSelect(
      'comment.assignedUser',
      'assignedUser',
    )
    .where('comment.issueId = :issueId', {
      issueId: issue.id,
    })
    .andWhere('comment.assignedTo IS NOT NULL')
    .orderBy('comment.createdAt', 'DESC')
    .getOne();

    return {
      statusCode: 200,
      data: issue,
      currentAssignee: lastAssignment?.assignedUser ?? null,
    };
  }
  //UPDATE ISSUE
  async updateIssue(
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

  // CLOSE ISSUE
  async closeIssue(
  uuid: string,
  closeIssueDto: CloseIssueDto,
  userUuid: string,
) {
  const { comment } = closeIssueDto;

  const issue = await this.issueRepository.findOne({
    where: { uuid },
  });

  if (!issue) {
    throw new NotFoundException(`Issue with UUID ${uuid} not found`);
  }

  const user = await this.userRepository.findOne({
    where: { uuid: userUuid },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // Backend ndiyo inaamua status
  issue.closedBy = user;
  issue.status = IssueStatus.CLOSED;

  const savedIssue = await this.issueRepository.save(issue);

  return {
    statusCode: 200,
    message: 'Issue closed successfully',
    issueId: savedIssue.id,
    uuid: savedIssue.uuid,
    comment: comment,
    status: savedIssue.status,
  };
}


  //Find my issue
  async findMyIssues(
  userUuid: string,
  queryParamsDto: QueryParamsDto,
  paginationOptsDto: PaginationOptionsDto,
) {
  const { search, orderBy, sortOrder } = queryParamsDto;

  // 1. Validate UUID
  if (!isUUID(userUuid)) {
    throw new BadRequestException('Invalid user UUID');
  }

  // 2. Find logged-in user
  const user = await this.userRepository.findOne({
    where: { uuid: userUuid },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // 3. Build issue query
  const queryBuilder = this.issueRepository
    .createQueryBuilder('issue')
    .leftJoinAndSelect('issue.createdBy', 'createdBy')
    .leftJoinAndSelect('issue.updatedBy', 'updatedBy')
    .leftJoinAndSelect('issue.company', 'company')
    .leftJoinAndSelect('company.product', 'product')
    .leftJoinAndSelect('issue.comments', 'comment')
    .leftJoinAndSelect('comment.assignedUser', 'assignedUser');

  // 4. Get only the latest assignment for each issue
  queryBuilder.andWhere(
    `comment.id = (
      SELECT c.id
      FROM comments c
      WHERE c.issue_id = issue.id
      AND c.assigned_to IS NOT NULL
      ORDER BY c.created_at DESC
      LIMIT 1
    )`,
  );

  // 5. Make sure the latest assignment belongs to the logged-in user
  queryBuilder.andWhere(
    'comment.assigned_to = :userId',
    {
      userId: user.id,
    },
  );

  // 6. Do not show solved/closed issues
  queryBuilder.andWhere(
  'issue.status = :status',
  {
    status: IssueStatus.IN_PROGRESS,
  },
);

  // 7. Search
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

  // 8. Sorting
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

  // 9. Pagination
  return PaginationService.paginate(
    queryBuilder,
    paginationOptsDto,
  );
}}