import { UsersService } from '../../services/users/users.service';
import { CreateUserDto } from '../../dtos/create-user.dto';
import { User } from '../../entities/user.entity';
import { Public } from '../../../../common/decorators/is-public-route.decorator';
import { PaginationOptionsDto } from '../../../../common/pagination/dto/pagination-options.dto';
import { QueryParamsDto } from '../../../../common/queries/query-params.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  ParseUUIDPipe, 
  Post, 
  Query, 
  UseGuards, 
} from '@nestjs/common';
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
  async create(@Body() createUserDto: CreateUserDto): Promise<{ user: User }> {
    return this.usersService.create(createUserDto);
  }

  @ApiBearerAuth()
 @UseGuards(JwtAuthGuard)
 @ApiOperation({ summary: 'Get all users' })
   @ApiResponse({ status: 201, description: 'User retrieved successfully.' })
  @Get()
  async findAll(
    @Query() paginationOptsDto: PaginationOptionsDto,
    @Query() queryParamsDto: QueryParamsDto,
  ) {
    return await this.usersService.findAll(queryParamsDto, paginationOptsDto);
  }

@ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 201, description: 'User profile retrieved successfully.' })
  @Get(':uuid/profile')
async getUserProfile(
  @Param('uuid', new ParseUUIDPipe()) uuid: string,
) {
  return this.usersService.getUserProfile(uuid);
}

  @ApiOperation({ summary: 'Get a user' })
  @ApiResponse({ status: 201, description: 'User retrieved successfully.' })
  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string): Promise<User> {
    return this.usersService.findOne(uuid);
  }
}
