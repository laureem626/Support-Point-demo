import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Designation } from '../../entities/designation.entity';
import { CreateUserDto } from '../../dtos/create-user.dto';
import { UserQueryDto } from '../../dtos/user-query.dto';
import { PaginationOptionsDto } from '../../../../common/pagination/dto/pagination-options.dto';
import { hashPassword } from '../../../../common/utils/password-hash';
import { validateAndSort } from '../../../../common/utils/sort-queryset';
import { PaginationService } from '../../../../common/pagination/pagination-service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Designation)
    private readonly designationRepository: Repository<Designation>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<{ user: User }> {
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
    }

    return {
      user: userWithDesignations,
    };
  }

  async findAll(
    query: UserQueryDto,
    paginationOptsDto: PaginationOptionsDto,
  ) {
    const { search, orderBy, sortOrder, isActive, designation } = query;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.designations', 'designation')
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

    // Filter based on active/not active
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', {
        isActive,
      });
    }

    // Filter by designation
    if (designation && designation.length > 0) {
      const designationList = Array.isArray(designation)
        ? designation
        : [designation];

      queryBuilder.andWhere(
        `EXISTS (
      SELECT 1 FROM "designations" d
      WHERE d."userId" = "user"."id"
      AND d."designation" IN (:...designationList)
    )`,
        { designationList },
      );
    }

    // Searching
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

    // Sorting
    await validateAndSort(
      queryBuilder,
      orderBy ?? 'id',
      sortOrder ?? 'ASC',
      'user',
      ['id', 'firstName', 'lastName', 'mobile'],
    );

    return PaginationService.paginate(
      queryBuilder,
      paginationOptsDto,
    );
  }

  async findOne(uuid: string): Promise<User> {
    const userWithDesignations =
      await this.usersRepository.findOne({
        where: {
          uuid,
        },
        relations: {
          designations: true,
        },
      });

    if (!userWithDesignations) {
      throw new NotFoundException(
        `User with UUID ${uuid} not found`,
      );
    }

    return userWithDesignations;
  }

  async getDistinctDesignations(): Promise<string[]> {
    const results = await this.designationRepository
      .createQueryBuilder('designation')
      .select('DISTINCT designation.designation', 'designation')
      .getRawMany();

    return results.map((row) => row.designation);
  }
}

  // async getUserProfile(uuid: string): Promise<User> {
  //   const user = await this.usersRepository.findOne({
  //     where: { uuid },
  //   });

  //   if (!user) {
  //     throw new NotFoundException(`User not found`);
  //   }

  //   return user;
  // }
