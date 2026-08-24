import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, UseGuards, Req } from '@nestjs/common';
import { IssuesService } from '../services/issue/issues.service';
import { CreateIssueDto } from '../dto/create-issue.dto';
import { UpdateIssueStatusDto } from '../dto/update-issue.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { CreateAssignmentDto } from '../dto/create.assignment.dto';
import { User } from 'src/modules/users/entities/user.entity';



@Controller('api/issues')
@ApiTags('Issues')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) { }

  @Post()
create(
  @Body() createIssueDto: CreateIssueDto,
  @Req() req,
) {
  return this.issuesService.create(
    createIssueDto,
    req.user,
  );
}
   @Post('comments')
  createComment(@Body() createCommentDto: CreateCommentDto) {
    return this.issuesService.createComment(createCommentDto);
  }
  // POST /api/issues/assign
  @Post('assign')
  assignIssue(@Body() createAssignmentDto: CreateAssignmentDto) {
    return this.issuesService.assignIssue(createAssignmentDto);
  }

  // GET /api/issues/assign
  @Get('assign')
  getAssignments() {
    return this.issuesService.getAssignments();
  }

  // GET /api/issues/assign/:uuid
  @Get('assign/:uuid')
  getAssignment(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ) {
    return this.issuesService.getAssignment(uuid);
  }

  @Get()
  findAll() {
    return this.issuesService.findAll();
  }

  @Get(':uuid')
  findByUuid(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.issuesService.findByUuid(uuid);
  }

  @Patch(':uuid')
  updateStatus(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateDto: UpdateIssueStatusDto,
  ) {
    return this.issuesService.updateStatusByUuid(uuid, updateDto);
  }
}