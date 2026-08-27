import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompaniesService } from './company.service';
import { CompaniesController } from './controllers/company.controller';
import { Product } from '../products/entities/product.entity';
@Module({
     imports: [
    TypeOrmModule.forFeature([Company, Product]),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService, TypeOrmModule],
})
export class CompaniesModule {}