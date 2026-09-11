import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './services/product.service';
import { ProductsController } from './controllers/product.controller';
import { Product } from './entities/product.entity';
import { Module } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, User]), DashboardModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [TypeOrmModule],
})
export class ProductsModule {}
