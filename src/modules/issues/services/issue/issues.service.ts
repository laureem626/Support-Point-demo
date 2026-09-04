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
  ForbiddenException,
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

    if (user.designation !== Designation.SUPPORTER) {
    throw new ForbiddenException(
      'Only Supporter can create an issue',
    );
  }

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

   if (!lastAssignment) {
  // Only Supporter can comment on an unassigned issue
  if (currentUser.designation !== Designation.SUPPORTER) {
    throw new ForbiddenException(
      'You cannot comment because this issue is not assigned to you',
    );
  }
} else {
  // Issue is assigned, check whether current user is the assignee
  if (
    lastAssignment.assignedTo !== currentUser.id &&
    currentUser.designation !== Designation.SUPPORTER
  ) {
    throw new ForbiddenException(
      'You cannot comment because this issue is currently assigned to another user',
    );
  }
}

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

   if (
    lastAssignment &&
    lastAssignment.createdBy?.designation === Designation.QA &&
    currentDesignation === Designation.SUPPORTER &&
    assignedDesignation === Designation.BA
  ) {
    throw new ForbiddenException(
      'A Supporter cannot assign this issue to a BA after receiving it from QA',
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
  userUuid: string,
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

  // 1. Validate user UUID
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
    .leftJoinAndSelect('issue.company', 'company')
    .leftJoinAndSelect('company.product', 'product')
    .leftJoinAndSelect('issue.createdBy', 'createdBy')
    .leftJoinAndSelect('issue.updatedBy', 'updatedBy');

  // =========================================================
  // 4. ACCESS CONTROL
  // =========================================================

  if (user.designation === Designation.SUPPORTER) {
  // Supporter can only see issues created by themselves
  queryBuilder.andWhere(
    'issue.created_by = :userId',
    {
      userId: user.id,
    },
  );
} else if (user.designation !== Designation.SYSTEM_ADMIN) {
  queryBuilder.andWhere(
    `EXISTS (
      SELECT 1
      FROM comments assignment
      WHERE assignment.issue_id = issue.id
        AND assignment.created_by = :userId 
        AND assignment.assigned_to IS NOT NULL
        AND assignment.assigned_to != :userId
    )`,
    {
      userId: user.id,
    },
  );
}

  // =========================================================
  // 5. SEARCH
  // =========================================================

  if (search) {
    queryBuilder.andWhere(
      `(
        issue.title ILIKE :search OR
        issue.description ILIKE :search OR
        issue.reporterName ILIKE :search OR
        issue.reporterMobile ILIKE :search OR
        CONCAT('ISSUE-', LPAD(issue.id::text, 4, '0')) ILIKE :search OR
        issue.id::text ILIKE :search
      )`,
      {
        search: `%${search}%`,
      },
    );
  }

  // =========================================================
  // 6. FILTER
  // =========================================================

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

  // =========================================================
  // 7. SORT
  // =========================================================

  queryBuilder.orderBy(
    `issue.${orderBy}`,
    sortOrder === 'ASC' ? 'ASC' : 'DESC',
  );

  // =========================================================
  // 8. PAGINATION
  // =========================================================

  const page = paginationOptsDto.page || 1;
  const limit = paginationOptsDto.pageSize || 10;

  const skip = (page - 1) * limit;

  queryBuilder.skip(skip).take(limit);

  // =========================================================
  // 9. GET ISSUES
  // =========================================================

  const [issues, total] = await queryBuilder.getManyAndCount();

  // =========================================================
  // 10. GET CURRENT ASSIGNEE
  // =========================================================

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
    }),
  );

  // =========================================================
  // 11. RESPONSE
  // =========================================================

  return {
    data,
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
  // CLOSE ISSUE
async closeIssue(
  uuid: string,
  closeIssueDto: CloseIssueDto,
  userUuid: string,
) {
  const { comment } = closeIssueDto;

  // 1. Find the issue
  const issue = await this.issueRepository.findOne({
    where: { uuid },
  });

  if (!issue) {
    throw new NotFoundException(
      `Issue with UUID ${uuid} not found`,
    );
  }

  // 2. Find the user trying to close the issue
  const user = await this.userRepository.findOne({
    where: { uuid: userUuid },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // 3. Only a SUPPORTER can close an issue
  if (user.designation !== Designation.SUPPORTER) {
    throw new BadRequestException(
      'Only a Supporter can close an issue.',
    );
  }

  // 4. Get the latest assignment for this issue
  const lastAssignment = await this.commentRepository
    .createQueryBuilder('comment')
    .where('comment.issueId = :issueId', {
      issueId: issue.id,
    })
    .andWhere('comment.assignedTo IS NOT NULL')
    .orderBy('comment.createdAt', 'DESC')
    .getOne();

  // 5. If the issue is currently assigned, Supporter cannot close it
  if (lastAssignment) {
    throw new BadRequestException(
      'This issue is currently assigned and cannot be closed by a Supporter.',
    );
  }

  // 6. Close the issue
  issue.closedBy = user;
  issue.status = IssueStatus.CLOSED;

  const savedIssue = await this.issueRepository.save(issue);

  return {
    statusCode: 200,
    message: 'Issue closed successfully',
    issueId: savedIssue.id,
    uuid: savedIssue.uuid,
    comment,
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

  // ============================================================
  // 4. MY ISSUES
  // ============================================================

 // ============================================================
// 4. MY ISSUES
// ============================================================

if (user.designation === Designation.SUPPORTER) {
  queryBuilder.andWhere(
    new Brackets((qb) => {
      
      // A. Issues created by me AND not assigned to anyone
      qb.where(
        `issue.created_by = :userId
         AND NOT EXISTS (
           SELECT 1
           FROM comments c1
           WHERE c1.issue_id = issue.id
             AND c1.assigned_to IS NOT NULL
         )`,
      );

      // B. OR issues currently assigned to me
      qb.orWhere(
        `EXISTS (
           SELECT 1
           FROM comments c2
           WHERE c2.issue_id = issue.id
             AND c2.assigned_to = :userId
             AND c2.id = (
               SELECT c3.id
               FROM comments c3
               WHERE c3.issue_id = issue.id
                 AND c3.assigned_to IS NOT NULL
               ORDER BY c3.created_at DESC
               LIMIT 1
             )
         )`,
      );
    }),
    {
      userId: user.id,
    },
  );

} else if (
  user.designation === Designation.BA ||
  user.designation === Designation.DEVS ||
  user.designation === Designation.QA
) {

  // ============================================================
  // BA / DEVELOPER / QA
  // Only see issues currently assigned to me
  // ============================================================

  queryBuilder.andWhere(
    `EXISTS (
      SELECT 1
      FROM comments c
      WHERE c.issue_id = issue.id
        AND c.assigned_to = :userId
        AND c.id = (
          SELECT c2.id
          FROM comments c2
          WHERE c2.issue_id = issue.id
            AND c2.assigned_to IS NOT NULL
          ORDER BY c2.created_at DESC
          LIMIT 1
        )
    )`,
    {
      userId: user.id,
    },
  );

} else {

  // Other designations cannot see issues
  queryBuilder.andWhere('1 = 0');
}
  // ============================================================
  // 5. ONLY IN PROGRESS ISSUES
  // ============================================================

  queryBuilder.andWhere(
    'issue.status = :status',
    {
      status: IssueStatus.IN_PROGRESS,
    },
  );

  // ============================================================
  // 6. SEARCH
  // ============================================================

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

  // ============================================================
  // 7. SORTING
  // ============================================================

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

  // ============================================================
  // 8. PAGINATION
  // ============================================================

  return PaginationService.paginate(
    queryBuilder,
    paginationOptsDto,
  );
}


}