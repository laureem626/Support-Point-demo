import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UsersService } from '../../services/users/users.service';
import { CreateUserDto } from '../../dtos/create-user.dto';
import { User } from '../../entities/user.entity';
import { Public } from '../../../../common/decorators/is-public-route.decorator';
import { PaginationOptionsDto } from '../../../../common/pagination/dto/pagination-options.dto';
import { QueryParamsDto } from '../../../../common/queries/query-params.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@Controller()
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<{ user: User }> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(
    @Query() paginationOptsDto: PaginationOptionsDto,
    @Query() queryParamsDto: QueryParamsDto,
  ) {
    return await this.usersService.findAll(queryParamsDto, paginationOptsDto);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string): Promise<User> {
    return this.usersService.findOne(uuid);
  }
}
