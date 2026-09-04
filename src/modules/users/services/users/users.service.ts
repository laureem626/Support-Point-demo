import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../../dtos/create-user.dto';
import { hashPassword } from '../../../../common/utils/password-hash';
import { UserQueryDto } from '../../dtos/user-query.dto';
import { PaginationOptionsDto } from '../../../../common/pagination/dto/pagination-options.dto';
import { validateAndSort } from '../../../../common/utils/sort-queryset';
import { PaginationService } from '../../../../common/pagination/pagination-service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<{ user: User }> {
    //Hash the user's password
    const hashedPassword = await hashPassword(createUserDto.password);

    // Create a new user entity with hashed password and profile image path
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // Save the user entity to the database
    const savedUser = await this.usersRepository.save(user);

    // Remove password from the response without mutating the entity
    // const { password, ...userWithoutPassword } = savedUser;

    return {
      user: savedUser,
    };
  }

  async findAll(query: UserQueryDto, paginationOptsDto: PaginationOptionsDto) {
    const { search, orderBy, sortOrder, isActive, designation } = query;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.uuid',
        'user.firstName',
        'user.lastName',
        'user.mobile',
        'user.designation',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
      ]);

    // Filter based on active/not active
    if (isActive !== undefined) {
      queryBuilder.where('user.isActive = :isActive', {
        isActive,
      });
    }

    // Filter by designation
    if (designation) {
      queryBuilder.andWhere('user.designation = :designation', {
        designation,
      });
    }

    // Searching
    if (search) {
      queryBuilder.andWhere(
        `(
          user.firstName ILIKE :search OR
          user.lastName ILIKE :search OR
          user.mobile ILIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    const userExists = await queryBuilder.getOne();
    if (!userExists) {
      throw new NotFoundException('User does not exist');
    }

    //Sorting
    await validateAndSort(
      queryBuilder,
      orderBy ?? 'id',
      sortOrder ?? 'ASC',
      'user',
      ['id', 'firstName', 'lastName', 'mobile', 'designation'],
    );

    return PaginationService.paginate(queryBuilder, paginationOptsDto);
  }

  async findOne(uuid: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { uuid },
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return user;
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
}
