import { UsersService } from '../../services/users/users.service';
import { CreateUserDto } from '../../dtos/create-user.dto';
import { UpdateUserDto } from '../../dtos/update-user.dto';
import { Public } from '../../../../common/decorators/is-public-route.decorator';
import { PaginationOptionsDto } from '../../../../common/pagination/dto/pagination-options.dto';
import { UserQueryDto } from '../../dtos/user-query.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
@Controller('api/users')
@ApiTags('Users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Update a user by UUID' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @Patch(':uuid')
  async update(
    @Param('uuid', new ParseUUIDPipe()) uuid: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(uuid, updateUserDto);
  }

  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  @Get()
  async findAll(
    @Query() paginationOptsDto: PaginationOptionsDto,
    @Query() queryParamsDto: UserQueryDto,
    @Req() req: Request,
  ) {
    return await this.usersService.findAll(queryParamsDto, paginationOptsDto, req);
  }

  // @ApiOperation({ summary: 'Get user profile' })
  //   @ApiResponse({ status: 201, description: 'User profile retrieved successfully.' })
  //   @Get(':uuid/profile')
  // async getUserProfile(
  //   @Param('uuid', new ParseUUIDPipe()) uuid: string,
  // ) {
  //   return this.usersService.getUserProfile(uuid);
  // }

  @ApiOperation({ summary: 'Get a user' })
  @ApiResponse({ status: 201, description: 'User retrieved successfully.' })
  @Get(':uuid')
  async findOne(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
    return this.usersService.findOne(uuid);
  }
}

