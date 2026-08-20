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
    const [data, itemCount] = await queryBuilder
      .skip((pageOptionsDto.page! - 1) * pageOptionsDto.pageSize!)
      .take(pageOptionsDto.pageSize!)
      .getManyAndCount();

    const meta = new PageMetaDto({
      pageOptionsDto,
      itemCount,
      baseUrl: 'process.env.APP_URL',
    });

    return {
      data,
      meta,
    };
  }
}
