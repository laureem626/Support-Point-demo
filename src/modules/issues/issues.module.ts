import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesController } from './controller/issues.controller';
import { IssuesService } from './services/issue/issues.service';
import { Issue } from './entities/issues/issues.entity';
import { User } from '../users/entities/user.entity';
import { IssueAssignment } from './entities/issues/issues-assignment.entity';
import { Comment } from './entities/issues/comment.entity';
import { Company } from '../companies/entities/company.entity';
import { NotificationsModule } from '../notifications/module/notifications.module';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue, Comment, IssueAssignment, Company, User]),
    DashboardModule,
    NotificationsModule,
  ],
  controllers: [IssuesController],
  providers: [IssuesService],
  exports: [IssuesService, TypeOrmModule],
})
export class IssuesModule {}
