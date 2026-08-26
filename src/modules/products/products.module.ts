import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './services/product.service';
import { ProductsController } from './controllers/product.controller';
import { Product } from './entities/product.entity';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [TypeOrmModule],
})
export class ProductsModule {}
