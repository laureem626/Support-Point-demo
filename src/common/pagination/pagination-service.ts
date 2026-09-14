import { Injectable } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationOptionsDto } from './dto/pagination-options.dto';
import { PaginationResult } from './dto/pagination-results.dt';
import { PageMetaDto } from './dto/page-meta.dto';

@Injectable()
export class PaginationService {
  static async paginate<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    pageOptionsDto: PaginationOptionsDto,
  ): Promise<PaginationResult<T>> {
    const page = pageOptionsDto.page ?? 1;
    const pageSize = pageOptionsDto.pageSize ?? 10;

    const [data, itemCount] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const baseUrl = process.env.APP_URL || 'http://localhost:3000'; // Fixed environment variable string bug

    const meta = new PageMetaDto({
      pageOptionsDto: { ...pageOptionsDto, page, pageSize },
      itemCount,
      baseUrl,
    });

    return {
      data,
      meta,
    };
  }
}