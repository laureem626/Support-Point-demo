import { Injectable, NotFoundException,BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from '../../entities/issues/issues.entity';
import { CreateIssueDto } from '../../dto/create-issue.dto';
import { UpdateIssueStatusDto } from '../../dto/update-issue.dto';
import { CreateCommentDto } from '../../dto/create-comment.dto';
import { IssueAssignment } from '../../entities/issues/issues-assignment.entity';
import { CreateAssignmentDto } from '../../dto/create.assignment.dto'; 
import { User } from 'src/modules/users/entities/user.entity';
import { Comment } from '../../entities/issues/comment.entity';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(IssueAssignment)
    private readonly assignmentRepository: Repository<IssueAssignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
   ) {}

  async create(createIssueDto: CreateIssueDto, user: User) {
   const issue = this.issueRepository.create({
    ...createIssueDto,
    attachment: createIssueDto.attachment ?? null,
    createdBy: user,
    updatedBy: user,
  });

  const saved = await this.issueRepository.save(issue);
  saved.number = `ISSUE-${String(saved.id).padStart(4, '0')}`;
   await this.issueRepository.save(saved);

  return {
    status: 201,
    message: 'Issue reported successfully',
    data: saved,
  };
}

  //POST AN ISSUE
  async createComment(createCommentDto: CreateCommentDto) {
 const { userId, issueId, comments } = createCommentDto;

  const issue = await this.issueRepository.findOne({
    where: { id: issueId },
  });

  if (!issue) {
    throw new NotFoundException('Issue not found');
  }

  const comment = this.commentRepository.create({
    issueId: issue.id,
    userId,
    comments,
  });
  return this.commentRepository.save(comment);
} 

 //POST /api/issues/assign
async assignIssue(createAssignmentDto: CreateAssignmentDto) {
  const { issueUuid, userId, description } = createAssignmentDto;

  // Find issue using UUID
  const issue = await this.issueRepository.findOne({
    where: { uuid: issueUuid },
  });

  if (!issue) {
    throw new NotFoundException('Issue not found');
  }

  // Find user using userId
  const user = await this.userRepository.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // Create assignment
  const assignment = this.assignmentRepository.create({
    issueId: issue.id,
    userId: user.id,
    description,
  });

  // Save assignment
  return this.assignmentRepository.save(assignment);
}

 //GET ALL ISSUES
  async findAll() {
    const data = await this.issueRepository.find({
      order: { id: 'ASC' },
    });
    return {
      status: 200,
      message: 'Issues retrieved successfully',
      data,
    };
  }

  //GET ISSUE AND IT DETAILS
  async findByUuid(uuid: string) {
    const issue = await this.issueRepository.findOne({
      where: { uuid },
     relations: {
  comments: true,
  assignments: true,
},
    });

    if (!issue) {
      throw new NotFoundException(`Issue with UUID ${uuid} not found`);
    }

    return {
      status: 200,
      data: issue,
    };
  }

//UPDATE ISSUE STATUS
  async updateStatusByUuid(uuid: string, updateDto: UpdateIssueStatusDto) {
    const issue = await this.issueRepository.findOne({ where: { uuid } });
    if (!issue) {
      throw new NotFoundException(`Issue with UUID ${uuid} not found`);
    }

    issue.status = updateDto.status;
    await this.issueRepository.save(issue);

    return {
      status: 200,
      message: 'Issue updated successfully',
    };
  }

//GET /api/issues/assign
  async getAssignments() {
  return this.assignmentRepository.find({
    relations: {
      issue: true,
      user: true,
    },
  });
}

//GET /api/issues/assign/:uuid
async getAssignment(uuid: string) {
  const assignment = await this.assignmentRepository.findOne({
    where: { uuid },
    relations: {
      issue: true,
      user: true,
    },
  });

  if (!assignment) {
    throw new NotFoundException('Assignment not found');
  }

  return assignment;
}
}
