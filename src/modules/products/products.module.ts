import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './services/product.service';
import { ProductsController } from './controllers/product.controller';
import { Product } from './entities/product.entity';
import { RouterModule } from '@nestjs/core';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    RouterModule.register([
      {
        path: 'products',
        module: ProductsModule,
      },
    ]),
    TypeOrmModule.forFeature([Product]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [TypeOrmModule],
})
export class ProductsModule {}
