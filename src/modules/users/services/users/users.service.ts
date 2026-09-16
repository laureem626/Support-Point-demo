import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Designation } from '../../entities/designation.entity';
import { CreateUserDto } from '../../dtos/create-user.dto';
import { UpdateUserDto } from '../../dtos/update-user.dto';
import { UserQueryDto } from '../../dtos/user-query.dto';
import { PaginationOptionsDto } from '../../../../common/pagination/dto/pagination-options.dto';
import { hashPassword } from '../../../../common/utils/password-hash';
import { validateAndSort } from '../../../../common/utils/sort-queryset';
import { PaginationService } from '../../../../common/pagination/pagination-service';
import { DashboardService } from 'src/modules/dashboard/services/dashboard.service';
import {Request} from 'express';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Designation)
    private readonly designationRepository: Repository<Designation>,

    private readonly dashboardService: DashboardService,
  ) {}

  // Helper method to flatten designation objects into a clean string array
  private formatUser(user: User) {
    const { designations, ...userData } = user;
    return {
      ...userData,
      designations: designations ? designations.map((d) => d.designation) : [],
    };
  }

  async create(createUserDto: CreateUserDto) {
    const { password, designations, ...userData } = createUserDto;

    const hashedPassword = await hashPassword(password);

    // Create user
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
    });

    // Save user first so we get the user ID
    const savedUser = await this.usersRepository.save(user);

    // Create designation records
    if (designations && designations.length > 0) {
      const designationEntities = designations.map((designation) =>
        this.designationRepository.create({
          designation,
          userId: savedUser.id,
        }),
      );

      await this.designationRepository.save(designationEntities);
    }

    // Load user together with designations
    const userWithDesignations = await this.usersRepository.findOne({
      where: {
        id: savedUser.id,
      },
      relations: {
        designations: true,
      },
    });

    if (!userWithDesignations) {
      throw new NotFoundException('User could not be found');

      await this.dashboardService.broadcastDashboardStats();
    }

    return {
      user: this.formatUser(userWithDesignations),
    };
  }

  async update(uuid: string, updateUserDto: UpdateUserDto) {
    const { password, designations, ...userData } = updateUserDto;

    //  Find existing user by uuid
    const user = await this.usersRepository.findOne({
      where: { uuid },
      relations: { designations: true },
    });

    if (!user) {
      throw new NotFoundException(`User with UUID ${uuid} not found`);
    }

    //  Handle password hashing if a new password is provided
    if (password) {
      user.password = await hashPassword(password);
    }

    //  Update basic user details
    Object.assign(user, userData);
    await this.usersRepository.save(user);

    //  Update designations if provided
    if (designations !== undefined) {
      // Remove old designations
      await this.designationRepository.delete({ userId: user.id });

      // Create new designation records
      if (designations.length > 0) {
        const designationEntities = designations.map((designation) =>
          this.designationRepository.create({
            designation,
            userId: user.id,
          }),
        );
        await this.designationRepository.save(designationEntities);
      }
    }

    //  Fetch and return the updated user with relations
    const updatedUser = await this.usersRepository.findOne({
      where: { id: user.id },
      relations: { designations: true },
    });

    if (!updatedUser) {
      throw new NotFoundException('Updated user could not be found');
    }

    await this.dashboardService.broadcastDashboardStats();

    return {
      user: this.formatUser(updatedUser),
    };
  }

  async findAll(
  query: UserQueryDto,
  paginationOptsDto: PaginationOptionsDto,
  req: Request,
) {
  const {
    search,
    orderBy,
    sortOrder,
    isActive,
    designation,
  } = query;

  const queryBuilder = this.usersRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect(
      'user.designations',
      'designation',
    )
    .select([
      'user.id',
      'user.uuid',
      'user.firstName',
      'user.lastName',
      'user.mobile',
      'user.isActive',
      'user.createdAt',
      'user.updatedAt',
      'designation.id',
      'designation.uuid',
      'designation.designation',
    ]);

  // ----------------------------------------------------------
  // 1. FILTER BY ACTIVE / NOT ACTIVE
  // ----------------------------------------------------------

  if (isActive !== undefined) {
    queryBuilder.andWhere(
      'user.isActive = :isActive',
      { isActive },
    );
  }

  // ----------------------------------------------------------
  // 2. FILTER BY DESIGNATION
  // ----------------------------------------------------------

  if (designation && designation.length > 0) {
    const designationList = Array.isArray(designation)
      ? designation
      : [designation];

    queryBuilder.andWhere(
      `EXISTS (
        SELECT 1
        FROM "designations" d
        WHERE d."userId" = "user"."id"
        AND d."designation" IN (:...designationList)
      )`,
      { designationList },
    );
  }

  // ----------------------------------------------------------
  // 3. SEARCH
  // ----------------------------------------------------------

  if (search) {
    queryBuilder.andWhere(
      `(
        user.firstName ILIKE :search OR
        user.lastName ILIKE :search OR
        user.mobile ILIKE :search
      )`,
      {
        search: `%${search}%`,
      },
    );
  }

  // ----------------------------------------------------------
  // 4. SORTING
  // ----------------------------------------------------------

  await validateAndSort(
    queryBuilder,
    orderBy ?? 'id',
    sortOrder ?? 'ASC',
    'user',
    [
      'id',
      'firstName',
      'lastName',
      'mobile',
    ],
  );

  // ----------------------------------------------------------
  // 5. PAGINATION
  // ----------------------------------------------------------

  const page =
    paginationOptsDto.page || 1;

  const pageSize =
    paginationOptsDto.pageSize || 10;

  const skip =
    (page - 1) * pageSize;

  queryBuilder
    .skip(skip)
    .take(pageSize);

  // ----------------------------------------------------------
  // 6. GET USERS + TOTAL
  // ----------------------------------------------------------

  const [
    users,
    total,
  ] = await queryBuilder.getManyAndCount();

  // ----------------------------------------------------------
  // 7. FORMAT USERS
  // ----------------------------------------------------------

  const data = users.map(
    (user: User) =>
      this.formatUser(user),
  );

  // ----------------------------------------------------------
  // 8. PAGINATION INFORMATION
  // ----------------------------------------------------------

  const pageCount =
    Math.ceil(total / pageSize);

  // ----------------------------------------------------------
  // 9. BUILD PAGINATION LINK
  // ----------------------------------------------------------

  const buildPaginationLink = (
    targetPage: number,
  ) => {
    const params =
      new URLSearchParams();

    params.set(
      'page',
      targetPage.toString(),
    );

    params.set(
      'pageSize',
      pageSize.toString(),
    );

    if (search) {
      params.set(
        'search',
        search,
      );
    }

    if (orderBy) {
      params.set(
        'orderBy',
        orderBy,
      );
    }

    if (sortOrder) {
      params.set(
        'sortOrder',
        sortOrder,
      );
    }

    if (isActive !== undefined) {
      params.set(
        'isActive',
        isActive.toString(),
      );
    }

    if (
      designation &&
      designation.length > 0
    ) {
      const designationList =
        Array.isArray(designation)
          ? designation
          : [designation];

      designationList.forEach(
        (value) => {
          params.append(
            'designation',
            value,
          );
        },
      );
    }

    const baseUrl =
      `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;

    return `${baseUrl}?${params.toString()}`;
  };

  // ----------------------------------------------------------
  // 10. RESPONSE
  // ----------------------------------------------------------

  return {
    data,

    meta: {
      page,
      pageSize,
      itemCount: total,
      pageCount,
      nextLink:
        page < pageCount
          ? buildPaginationLink(
              page + 1,
            )
          : null,

      prevLink:
        page > 1
          ? buildPaginationLink(
              page - 1,
            )
          : null,
    },
  };
}

  async findOne(uuid: string) {
    const userWithDesignations = await this.usersRepository.findOne({
      where: { uuid },
      relations: { designations: true },
    });

    if (!userWithDesignations) {
      throw new NotFoundException(`User with UUID ${uuid} not found`);
    }

    return this.formatUser(userWithDesignations);
  }

  async getDistinctDesignations(): Promise<string[]> {
    const results = await this.designationRepository
      .createQueryBuilder('designation')
      .select('DISTINCT designation.designation', 'designation')
      .getRawMany();

    return results.map((row) => row.designation);
  }
}
