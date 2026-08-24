import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompaniesService } from './company.service';
import { CompaniesController } from './controllers/company.controller';
import { RouterModule } from '@nestjs/core';


@Module({
     imports: [
    RouterModule.register([
      {
        path: 'companies',
        module: CompaniesModule,
      },
    ]),
    TypeOrmModule.forFeature([Company]),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService, TypeOrmModule],
})
export class CompaniesModule {}