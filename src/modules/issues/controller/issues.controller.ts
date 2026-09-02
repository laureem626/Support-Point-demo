import { IssuesService } from '../services/issue/issues.service';
import { CreateIssueDto } from '../dto/create-issue.dto';
import { UpdateIssueStatusDto } from '../dto/update-issue.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { CloseIssueDto } from '../dto/close-issue.dto';
import { CreateAssignmentDto } from '../dto/create.assignment.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { SearchParams } from 'src/common/utils/searchparams.utils';
import { PaginationOptionsDto } from 'src/common/pagination/dto/pagination-options.dto';
import { QueryParamsDto } from 'src/common/queries/query-params.dto';
import {ApiBearerAuth,ApiOperation,ApiQuery,ApiResponse, ApiTags,} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';




@Controller('api/issues')
@ApiTags('Issues')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an issue' })
  @ApiResponse({ status: 201, description: 'Issue created successfully.' })
  create(@Body() createIssueDto: CreateIssueDto, @Req() req: any) {
    return this.issuesService.create(createIssueDto, req.user);
  }
  
  @Post('comments')
  @ApiOperation({ summary: 'Create a comment' })
  @ApiResponse({ status: 201, description: 'Comment created successfully.' })
 async createComment(
  @Req() req,
  @Body() createCommentDto: CreateCommentDto,
) {
  return this.issuesService.createComment(
    createCommentDto,
    req.user.uuid,
  );
}
  
 
  @Get()
  @ApiOperation({ summary: 'Get all issues' })
  @ApiResponse({ status: 201, description: 'Issues retrieved successfully.' })
  async findAll(
    @Query() queryParamsDto: QueryParamsDto,
    @Query() paginationOptsDto: PaginationOptionsDto,
  ) {
    return this.issuesService.findAll(queryParamsDto, paginationOptsDto);
  }

  @Patch(':uuid')
  @ApiOperation({ summary: 'update issue status' })
  @ApiResponse({
    status: 201,
    description: 'Issue status updated successfully.',
  })
  UpdateIssueStatus(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateDto: UpdateIssueStatusDto,
    @Req() req,
  ) {
    return this.issuesService.updateIssue(uuid, updateDto, req.user.uuid);
  }

   @Post(':uuid/close')
  @ApiOperation({ summary: 'Close issue' })
  @ApiResponse({
    status: 200,
    description: 'Issue closed successfully.',
  })
  closeIssue(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() closeIssueDto: CloseIssueDto,
    @Req() req,
  ) {
    return this.issuesService.closeIssue(uuid, closeIssueDto, req.user.uuid);
  }
  //GET MY ISSUES
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    example: 10,
  })
  @Get('my-issues')
  async findMyIssues(
    @Req() req,
    @Query() queryParamsDto: QueryParamsDto,
    @Query() paginationOptsDto: PaginationOptionsDto,
  ) {
    return this.issuesService.findMyIssues(
      req.user.uuid,
      queryParamsDto,
      paginationOptsDto,
    );
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get an issue by UUID' })
  @ApiResponse({ status: 201, description: 'Issue retrieved successfully.' })
  findByUuid(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.issuesService.findByUuid(uuid);
  }
}
