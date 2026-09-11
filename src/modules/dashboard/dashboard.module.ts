import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Product } from '../products/entities/product.entity';
import { Issue } from '../issues/entities/issues/issues.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardGateway } from './gateway/dashboard.gateway';
@Module({
  imports: [TypeOrmModule.forFeature([Issue,Product, Company, User])],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardGateway],
  exports: [DashboardService]
})
export class DashboardModule {}
