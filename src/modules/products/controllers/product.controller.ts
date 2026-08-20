import { Controller, Get, Post, Body, Param, ParseIntPipe, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';

import { ProductsService } from '../services/product.service';
import { CreateProductDto } from '../dtos/create-product.dto';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Body() createProductDto: CreateProductDto, @Res() res: Response) {
    const product = await this.productsService.create(createProductDto);
    
    return res.status(HttpStatus.CREATED).json({
      status: HttpStatus.CREATED,
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  }

  @Get()
  async findAll(@Res() res: Response) {
    const products = await this.productsService.findAll();
    
    return res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      success: true,
      message: 'Products retrieved successfully',
      data: products,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const product = await this.productsService.findOne(id);
    
    return res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      data: product,
    });
  }
}