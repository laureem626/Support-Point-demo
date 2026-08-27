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
import { IssuesService } from '../services/issue/issues.service';
import { CreateIssueDto } from '../dto/create-issue.dto';
import { UpdateIssueStatusDto } from '../dto/update-issue.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { CreateAssignmentDto } from '../dto/create.assignment.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { SearchParams } from 'src/common/utils/searchparams.utils';
import { PaginationOptionsDto } from 'src/common/pagination/dto/pagination-options.dto';
import { QueryParamsDto } from 'src/common/queries/query-params.dto';

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
  createComment(@Body() createCommentDto: CreateCommentDto) {
    return this.issuesService.createComment(createCommentDto);
  }
  // POST /api/issues/assign
  @Post('assign')
  @ApiOperation({ summary: 'Assign an issue' })
  @ApiResponse({ status: 201, description: 'Issue assigned successfully.' })
  assignIssue(@Body() createAssignmentDto: CreateAssignmentDto) {
    return this.issuesService.assignIssue(createAssignmentDto);
  }

  // GET /api/issues/assign
  @Get('assign')
  @ApiOperation({ summary: 'Get assigned issues' })
  @ApiResponse({
    status: 201,
    description: 'Assigned issues retrieved successfully.',
  })
  getAssignments() {
    return this.issuesService.getAssignments();
  }

  // GET /api/issues/assign/:uuid
  @Get('assign/:uuid')
  @ApiOperation({ summary: 'Get a specific assignment' })
  @ApiResponse({
    status: 201,
    description: 'Assignment retrieved successfully.',
  })
  getAssignment(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.issuesService.getAssignment(uuid);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all issues' })
  @ApiResponse({ status: 201, description: 'Issues retrieved successfully.' })
  findAll() {
    return this.issuesService.findAll();
  }


  @Patch(':uuid')
  @ApiOperation({ summary: 'Update issue status by UUID' })
  @ApiResponse({
    status: 201,
    description: 'Issue status updated successfully.',
  })
  updateStatus(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateDto: UpdateIssueStatusDto,
  ) {
    return this.issuesService.updateStatusByUuid(uuid, updateDto);
  }

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
  @ApiOperation({ summary: 'Retrieve an issue by UUID' })
  @ApiResponse({ status: 201, description: 'Issue retrieved successfully.' })
  findByUuid(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.issuesService.findByUuid(uuid);
  }
}
