import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Brackets,
  Repository,
} from 'typeorm';

import { isUUID } from 'class-validator';

import { instanceToPlain } from 'class-transformer';

import { Issue } from '../../entities/issues/issues.entity';
import { CreateIssueDto } from '../../dto/create-issue.dto';
import { UpdateIssueStatusDto } from '../../dto/update-issue.dto';
import { CloseIssueDto } from '../../dto/close-issue.dto';
import { CreateCommentDto } from '../../dto/create-comment.dto';

import { IssueAssignment } from '../../entities/issues/issues-assignment.entity';

import { User } from 'src/modules/users/entities/user.entity';

import { Comment } from '../../entities/issues/comment.entity';

import { Company } from 'src/modules/companies/entities/company.entity';

import { PaginationOptionsDto } from 'src/common/pagination/dto/pagination-options.dto';
import { PaginationService } from 'src/common/pagination/pagination-service';

import { validateAndSort } from 'src/common/utils/sort-queryset';

import {
  Designation,
  IssueStatus,
} from 'src/common/enums/issue.enum';

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

  // ============================================================
  // GET USER DESIGNATION
  // ============================================================

  private getDesignation(
    user: User,
  ): Designation | undefined {
    return user.designations?.[0]?.designation;
  }

  // ============================================================
  // CREATE ISSUE
  // ============================================================

  async create(
    createIssueDto: CreateIssueDto,
    user: User,
  ) {
    const {
      companyId,
      ...issueData
    } = createIssueDto;

    

 const currentUser =
    await this.userRepository.findOne({
      where: {
        id: user.id,
      },
      relations: {
        designations: true,
      },
    });

  if (!currentUser) {
    throw new NotFoundException(
      `User with ID ${user.id} not found`,
    );
  }

  // Check ALL user designations
  const isSupporter =
    currentUser.designations?.some(
      (designation) =>
        designation.designation ===
        Designation.SUPPORTER,
    ) ?? false;

  if (!isSupporter) {
    throw new ForbiddenException(
      'Only Supporter can create an issue',
    );
  
}

    const company =
      await this.companyRepository.findOne({
        where: {
          id: companyId,
        },
      });

    if (!company) {
      throw new NotFoundException(
        `Company with ID ${companyId} not found`,
      );
    }

    const issue =
      this.issueRepository.create({
        ...issueData,

        attachment:
          createIssueDto.attachment ?? null,

        company,

        createdBy: user,

        updatedBy: user,
      });

    const saved =
      await this.issueRepository.save(issue);

    const result =
      await this.issueRepository.findOne({
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

      message:
        'Issue reported successfully',

      ...instanceToPlain(result),
    };
  }

  // ============================================================
  // CREATE COMMENT / ASSIGN ISSUE
  // ============================================================

  async createComment(
    createCommentDto: CreateCommentDto,
    userUuid: string,
  ) {
    const {
      issueId,
      assignedId,
      comments,
    } = createCommentDto;

    // ----------------------------------------------------------
    // 1. Find issue
    // ----------------------------------------------------------

    const issue =
      await this.issueRepository.findOne({
        where: {
          id: issueId,
        },
      });

    if (!issue) {
      throw new NotFoundException(
        'Issue not found',
      );
    }

    // ----------------------------------------------------------
    // 2. Closed issues cannot be assigned
    // ----------------------------------------------------------

    if (
      issue.status ===
      IssueStatus.CLOSED
    ) {
      throw new BadRequestException(
        'Cannot assign a closed issue',
      );
    }

    // ----------------------------------------------------------
    // 3. Find current user
    // ----------------------------------------------------------

    const currentUser =
      await this.userRepository.findOne({
        where: {
          uuid: userUuid,
        },

        relations: {
          designations: true,
        },
      });

    if (!currentUser) {
      throw new NotFoundException(
        'Current user not found',
      );
    }

    // ----------------------------------------------------------
    // 4. Find assigned user
    // ----------------------------------------------------------

    const assignedUser =
      await this.userRepository.findOne({
        where: {
          id: assignedId,
        },

        relations: {
          designations: true,
        },
      });

    if (!assignedUser) {
      throw new NotFoundException(
        'Assigned user not found',
      );
    }

    // ----------------------------------------------------------
    // 5. Get latest assignment
    // ----------------------------------------------------------

    const lastAssignment =
      await this.commentRepository
        .createQueryBuilder('comment')

        .leftJoinAndSelect(
          'comment.createdBy',
          'createdBy',
        )

        .leftJoinAndSelect(
          'createdBy.designations',
          'createdByDesignation',
        )

        .where(
          'comment.issueId = :issueId',
          {
            issueId,
          },
        )

        .andWhere(
          'comment.assignedTo IS NOT NULL',
        )

        .orderBy(
          'comment.createdAt',
          'DESC',
        )

        .getOne();

    // ----------------------------------------------------------
    // 6. Check who currently owns issue
    // ----------------------------------------------------------

    if (!lastAssignment) {
      // No assignment yet.
      // Only Supporter can assign it initially.

      const currentDesignation =
        this.getDesignation(currentUser);

      if (
        currentDesignation !==
        Designation.SUPPORTER
      ) {
        throw new ForbiddenException(
          'You cannot comment because this issue is not assigned to you',
        );
      }
    } else {
      // Issue already has an assignment.
      // Only the current assignee can act.

      if (
        lastAssignment.assignedTo !==
        currentUser.id
      ) {
        throw new ForbiddenException(
          'You cannot comment because this issue is currently assigned to another user',
        );
      }
    }

    // ----------------------------------------------------------
    // 7. Validate assignment
    // ----------------------------------------------------------

    await this.validateAssignment(
      currentUser,
      assignedUser,
      lastAssignment,
    );

    // ----------------------------------------------------------
    // 8. Create comment / assignment
    // ----------------------------------------------------------

    const comment =
      this.commentRepository.create({
        issueId: issue.id,

        createdBy: currentUser,

        assignedTo: assignedUser.id,

        comments,
      });

    const saved =
      await this.commentRepository.save(
        comment,
      );

    // ----------------------------------------------------------
    // 9. Return saved comment
    // ----------------------------------------------------------

    const result =
      await this.commentRepository.findOne({
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

      message:
        'Comment created successfully',

      ...instanceToPlain(result),
    };
  }

  // ============================================================
  // VALIDATE ASSIGNMENT
  // ============================================================

  private async validateAssignment(
    currentUser: User,
    assignedUser: User,
    lastAssignment: Comment | null,
  ) {
    const currentDesignation =
      this.getDesignation(currentUser);

    const assignedDesignation =
      this.getDesignation(assignedUser);

    // ----------------------------------------------------------
    // Make sure designation exists
    // ----------------------------------------------------------

    if (!currentDesignation) {
      throw new ForbiddenException(
        'Current user has no designation',
      );
    }

    if (!assignedDesignation) {
      throw new BadRequestException(
        'Assigned user has no designation',
      );
    }

    // ----------------------------------------------------------
    // Cannot assign to same person
    // ----------------------------------------------------------

    if (
      lastAssignment &&
      lastAssignment.assignedTo ===
        assignedUser.id
    ) {
      throw new BadRequestException(
        'This issue is already assigned to this user',
      );
    }

    // ----------------------------------------------------------
    // No previous assignment
    // ----------------------------------------------------------

    if (!lastAssignment) {
      if (
        currentDesignation ===
          Designation.SUPPORTER &&
        assignedDesignation ===
          Designation.BA
      ) {
        return;
      }

      throw new BadRequestException(
        `${currentDesignation} cannot assign this issue to ${assignedDesignation}.`,
      );
    }

    // ----------------------------------------------------------
    // Current assignee
    // ----------------------------------------------------------

    const currentAssigneeId =
      lastAssignment.assignedTo;

    if (
      currentAssigneeId !==
      currentUser.id
    ) {
      throw new BadRequestException(
        'You cannot assign this issue because it is not currently assigned to you.',
      );
    }

    // ----------------------------------------------------------
    // Supporter received issue from QA
    //
    // QA -> SUPPORTER
    // SUPPORTER cannot send it back to BA
    // ----------------------------------------------------------

    const lastAssignmentCreatedBy =
      lastAssignment.createdBy;

    const lastAssignmentCreatorDesignation =
      lastAssignmentCreatedBy
        ? this.getDesignation(
            lastAssignmentCreatedBy,
          )
        : undefined;

    if (
      lastAssignmentCreatorDesignation ===
        Designation.QA &&
      currentDesignation ===
        Designation.SUPPORTER &&
      assignedDesignation ===
        Designation.BA
    ) {
      throw new ForbiddenException(
        'A Supporter cannot assign this issue to a BA after receiving it from QA',
      );
    }

    // ----------------------------------------------------------
    // SUPPORTER -> BA
    // ----------------------------------------------------------

    if (
      currentDesignation ===
        Designation.SUPPORTER &&
      assignedDesignation ===
        Designation.BA
    ) {
      return;
    }

    // ----------------------------------------------------------
    // BA -> DEVELOPER
    // ----------------------------------------------------------

    if (
      currentDesignation ===
        Designation.BA &&
      assignedDesignation ===
        Designation.DEVS
    ) {
      return;
    }

    // ----------------------------------------------------------
    // BA -> SUPPORTER
    //
    // Only if Supporter previously assigned
    // this issue to this BA
    // ----------------------------------------------------------

    if (
      currentDesignation ===
        Designation.BA &&
      assignedDesignation ===
        Designation.SUPPORTER
    ) {
      const previousSupporterAssignment =
        await this.commentRepository
          .createQueryBuilder('comment')

          .innerJoinAndSelect(
            'comment.createdBy',
            'creator',
          )

          .innerJoin(
            'creator.designations',
            'creatorDesignation',
          )

          .where(
            'comment.issueId = :issueId',
            {
              issueId:
                lastAssignment.issueId,
            },
          )

          .andWhere(
            'comment.assignedTo = :baId',
            {
              baId: currentUser.id,
            },
          )

          .andWhere(
            'creatorDesignation.designation = :designation',
            {
              designation:
                Designation.SUPPORTER,
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

    // ----------------------------------------------------------
    // DEVELOPER -> QA
    // ----------------------------------------------------------

    if (
      currentDesignation ===
        Designation.DEVS &&
      assignedDesignation ===
        Designation.QA
    ) {
      return;
    }

    // ----------------------------------------------------------
    // Developer cannot assign elsewhere
    // ----------------------------------------------------------

    if (
      currentDesignation ===
      Designation.DEVS
    ) {
      throw new BadRequestException(
        'Developer can only assign an issue to QA.',
      );
    }

    // ----------------------------------------------------------
    // QA -> DEVELOPER
    // ----------------------------------------------------------

    if (
      currentDesignation ===
        Designation.QA &&
      assignedDesignation ===
        Designation.DEVS
    ) {
      return;
    }

    // ----------------------------------------------------------
    // QA -> SUPPORTER
    // ----------------------------------------------------------

    if (
      currentDesignation ===
        Designation.QA &&
      assignedDesignation ===
        Designation.SUPPORTER
    ) {
      return;
    }

    // ----------------------------------------------------------
    // Everything else forbidden
    // ----------------------------------------------------------

    throw new BadRequestException(
      `${currentDesignation} cannot assign this issue to ${assignedDesignation}.`,
    );
  }

  // ============================================================
  // GET ALL ISSUES
  // ============================================================

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

    // ----------------------------------------------------------
    // 1. Validate UUID
    // ----------------------------------------------------------

    if (!isUUID(userUuid)) {
      throw new BadRequestException(
        'Invalid user UUID',
      );
    }

    // ----------------------------------------------------------
    // 2. Find user
    // ----------------------------------------------------------

    const user =
      await this.userRepository.findOne({
        where: {
          uuid: userUuid,
        },

        relations: {
          designations: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const userDesignation =
      this.getDesignation(user);

    // ----------------------------------------------------------
    // 3. Build query
    // ----------------------------------------------------------

    const queryBuilder =
      this.issueRepository
        .createQueryBuilder('issue')

        .leftJoinAndSelect(
          'issue.company',
          'company',
        )

        .leftJoinAndSelect(
          'company.product',
          'product',
        )

        .leftJoinAndSelect(
          'issue.createdBy',
          'createdBy',
        )

        .leftJoinAndSelect(
          'issue.updatedBy',
          'updatedBy',
        );

    // ----------------------------------------------------------
    // 4. ACCESS CONTROL
    // ----------------------------------------------------------

    const isSupporter = user.designations?.some(
  (designation) =>
    designation.designation === Designation.SUPPORTER,
) ?? false;

const isSystemAdmin = user.designations?.some(
  (designation) =>
    designation.designation === Designation.SYSTEM_ADMIN,
) ?? false;

if (isSupporter) {
  // Supporter can see issues they created
  queryBuilder.andWhere(
    'issue.created_by = :userId',
    {
      userId: user.id,
    },
  );
} else if (!isSystemAdmin) {
  // Other users can see issues they assigned
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

    // ----------------------------------------------------------
    // 5. SEARCH
    // ----------------------------------------------------------

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where(
            'issue.title ILIKE :search',
          )
            .orWhere(
              'issue.description ILIKE :search',
            )
            .orWhere(
              'issue.reporterName ILIKE :search',
            )
            .orWhere(
              'issue.reporterMobile ILIKE :search',
            )
            .orWhere(
              `CONCAT(
                'ISSUE-',
                LPAD(issue.id::text, 4, '0')
              ) ILIKE :search`,
            )
            .orWhere(
              'issue.id::text ILIKE :search',
            );
        }),
        {
          search: `%${search}%`,
        },
      );
    }

    // ----------------------------------------------------------
    // 6. FILTER STATUS
    // ----------------------------------------------------------

    if (status) {
      queryBuilder.andWhere(
        'issue.status = :status',
        {
          status,
        },
      );
    }

    // ----------------------------------------------------------
    // 7. FILTER PRIORITY
    // ----------------------------------------------------------

    if (priority) {
      queryBuilder.andWhere(
        'issue.priority = :priority',
        {
          priority,
        },
      );
    }

    // ----------------------------------------------------------
    // 8. SORT
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // 9. PAGINATION
    // ----------------------------------------------------------

    const page =
      paginationOptsDto.page || 1;

    const limit =
      paginationOptsDto.pageSize || 10;

    const skip =
      (page - 1) * limit;

    queryBuilder
      .skip(skip)
      .take(limit);

    // ----------------------------------------------------------
    // 10. GET ISSUES
    // ----------------------------------------------------------

    const [
      issues,
      total,
    ] =
      await queryBuilder.getManyAndCount();

    // ----------------------------------------------------------
    // 11. CURRENT ASSIGNEE
    // ----------------------------------------------------------

    const data =
      await Promise.all(
        issues.map(
          async (issue) => {
            const lastAssignment =
              await this.commentRepository
                .createQueryBuilder(
                  'comment',
                )

                .leftJoinAndSelect(
                  'comment.assignedUser',
                  'assignedUser',
                )

                .where(
                  'comment.issueId = :issueId',
                  {
                    issueId: issue.id,
                  },
                )

                .andWhere(
                  'comment.assignedTo IS NOT NULL',
                )

                .orderBy(
                  'comment.createdAt',
                  'DESC',
                )

                .getOne();

            return {
              ...instanceToPlain(issue),

              currentAssignee:
                lastAssignment?.assignedUser ??
                null,
            };
          },
        ),
      );

    // ----------------------------------------------------------
    // 12. RESPONSE
    // ----------------------------------------------------------

    return {
      data,

      meta: {
        total,
        page,
        limit,

        totalPages:
          Math.ceil(
            total / limit,
          ),
      },
    };
  }

  // ============================================================
  // GET ISSUE BY UUID
  // ============================================================

  async findByUuid(
    uuid: string,
  ) {
    const issue =
      await this.issueRepository.findOne({
        where: {
          uuid,
        },

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
      throw new NotFoundException(
        `Issue with UUID ${uuid} not found`,
      );
    }

    const lastAssignment =
      await this.commentRepository
        .createQueryBuilder('comment')

        .leftJoinAndSelect(
          'comment.assignedUser',
          'assignedUser',
        )

        .where(
          'comment.issueId = :issueId',
          {
            issueId: issue.id,
          },
        )

        .andWhere(
          'comment.assignedTo IS NOT NULL',
        )

        .orderBy(
          'comment.createdAt',
          'DESC',
        )

        .getOne();

    return {
      statusCode: 200,

      data: issue,

      currentAssignee:
        lastAssignment?.assignedUser ??
        null,
    };
  }

  // ============================================================
  // UPDATE ISSUE
  // ============================================================

  async updateIssue(
    uuid: string,
    updateDto: UpdateIssueStatusDto,
    userUuid: string,
  ) {
    const issue =
      await this.issueRepository.findOne({
        where: {
          uuid,
        },
      });

    if (!issue) {
      throw new NotFoundException(
        `Issue with UUID ${uuid} not found`,
      );
    }

    const user =
      await this.userRepository.findOne({
        where: {
          uuid: userUuid,
        },

        relations: {
          designations: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    issue.closedBy = user;

    issue.status =
      updateDto.status;

    await this.issueRepository.save(
      issue,
    );

    return {
      statusCode: 200,

      message:
        'Issue closed successfully',
    };
  }

  // ============================================================
  // CLOSE ISSUE
  // ============================================================

  async closeIssue(
    uuid: string,
    closeIssueDto: CloseIssueDto,
    userUuid: string,
  ) {
    const {
      comment,
    } = closeIssueDto;

    // ----------------------------------------------------------
    // 1. Find issue
    // ----------------------------------------------------------

    const issue =
      await this.issueRepository.findOne({
        where: {
          uuid,
        },
      });

    if (!issue) {
      throw new NotFoundException(
        `Issue with UUID ${uuid} not found`,
      );
    }

    // ----------------------------------------------------------
    // 2. Find user
    // ----------------------------------------------------------

    const user =
      await this.userRepository.findOne({
        where: {
          uuid: userUuid,
        },

        relations: {
          designations: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    // ----------------------------------------------------------
    // 3. Only Supporter can close
    // ----------------------------------------------------------

    const userDesignation =
      this.getDesignation(user);

    if (
      userDesignation !==
      Designation.SUPPORTER
    ) {
      throw new BadRequestException(
        'Only a Supporter can close an issue.',
      );
    }

    // ----------------------------------------------------------
    // 4. Get latest assignment
    // ----------------------------------------------------------

    const lastAssignment =
      await this.commentRepository
        .createQueryBuilder('comment')

        .where(
          'comment.issueId = :issueId',
          {
            issueId: issue.id,
          },
        )

        .andWhere(
          'comment.assignedTo IS NOT NULL',
        )

        .orderBy(
          'comment.createdAt',
          'DESC',
        )

        .getOne();

    // ----------------------------------------------------------
    // 5. If assigned to someone ELSE, cannot close
    //
    // If assigned to THIS Supporter, they CAN close.
    // ----------------------------------------------------------

    if (
      lastAssignment &&
      lastAssignment.assignedTo !==
        user.id
    ) {
      throw new BadRequestException(
        'This issue is currently assigned to another user and cannot be closed by this Supporter.',
      );
    }

    // ----------------------------------------------------------
    // 6. Close issue
    // ----------------------------------------------------------

    issue.closedBy = user;

    issue.status =
      IssueStatus.CLOSED;

    const savedIssue =
      await this.issueRepository.save(
        issue,
      );

    // ----------------------------------------------------------
    // 7. Response
    // ----------------------------------------------------------

    return {
      statusCode: 200,

      message:
        'Issue closed successfully',

      issueId: savedIssue.id,

      uuid: savedIssue.uuid,

      comment,

      status:
        savedIssue.status,
    };
  }

  // ============================================================
  // FIND MY ISSUES
  // ============================================================

  async findMyIssues(
    userUuid: string,
    queryParamsDto: QueryParamsDto,
    paginationOptsDto: PaginationOptionsDto,
  ) {
    const {
      search,
      orderBy,
      sortOrder,
    } = queryParamsDto;

    // ----------------------------------------------------------
    // 1. Validate UUID
    // ----------------------------------------------------------

    if (!isUUID(userUuid)) {
      throw new BadRequestException(
        'Invalid user UUID',
      );
    }

    // ----------------------------------------------------------
    // 2. Find user
    // ----------------------------------------------------------

    const user =
      await this.userRepository.findOne({
        where: {
          uuid: userUuid,
        },

        relations: {
          designations: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const userDesignation =
      this.getDesignation(user);

    // ----------------------------------------------------------
    // 3. Build query
    // ----------------------------------------------------------

    const queryBuilder =
      this.issueRepository
        .createQueryBuilder('issue')

        .leftJoinAndSelect(
          'issue.createdBy',
          'createdBy',
        )

        .leftJoinAndSelect(
          'issue.updatedBy',
          'updatedBy',
        )

        .leftJoinAndSelect(
          'issue.company',
          'company',
        )

        .leftJoinAndSelect(
          'company.product',
          'product',
        )

        .leftJoinAndSelect(
          'issue.comments',
          'comment',
        )

        .leftJoinAndSelect(
          'comment.assignedUser',
          'assignedUser',
        );

    // ----------------------------------------------------------
    // 4. SUPPORTER
    // ----------------------------------------------------------

    if (
      userDesignation ===
      Designation.SUPPORTER
    ) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          // A. Created by Supporter and
          //    not assigned yet

          qb.where(
            `issue.created_by = :userId
             AND NOT EXISTS (
               SELECT 1
               FROM comments c1
               WHERE c1.issue_id = issue.id
                 AND c1.assigned_to IS NOT NULL
             )`,
          );

          // B. Currently assigned to Supporter

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
    }

    // ----------------------------------------------------------
    // BA / DEVELOPER / QA
    // ----------------------------------------------------------

    else if (
      userDesignation ===
        Designation.BA ||
      userDesignation ===
        Designation.DEVS ||
      userDesignation ===
        Designation.QA
    ) {
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
    }

    // ----------------------------------------------------------
    // Other designations
    // ----------------------------------------------------------

    else {
      queryBuilder.andWhere(
        '1 = 0',
      );
    }

    // ----------------------------------------------------------
    // 5. ONLY IN PROGRESS
    // ----------------------------------------------------------

    queryBuilder.andWhere(
      'issue.status = :status',
      {
        status:
          IssueStatus.IN_PROGRESS,
      },
    );

    // ----------------------------------------------------------
    // 6. SEARCH
    // ----------------------------------------------------------

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where(
            'issue.title ILIKE :search',
          )

            .orWhere(
              'issue.description ILIKE :search',
            )

            .orWhere(
              'issue.reporterName ILIKE :search',
            )

            .orWhere(
              'issue.reporterMobile ILIKE :search',
            )

            .orWhere(
              'CAST(issue.status AS TEXT) ILIKE :search',
            )

            .orWhere(
              'CAST(issue.priority AS TEXT) ILIKE :search',
            )

            .orWhere(
              `CONCAT(
                'ISSUE-',
                LPAD(issue.id::text, 4, '0')
              ) ILIKE :search`,
            );
        }),
        {
          search: `%${search}%`,
        },
      );
    }

    // ----------------------------------------------------------
    // 7. SORTING
    // ----------------------------------------------------------

    await validateAndSort(
      queryBuilder,

      orderBy ??
        'createdAt',

      sortOrder ??
        'DESC',

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

    // ----------------------------------------------------------
    // 8. PAGINATION
    // ----------------------------------------------------------

    return PaginationService.paginate(
      queryBuilder,
      paginationOptsDto,
    );
  }
}