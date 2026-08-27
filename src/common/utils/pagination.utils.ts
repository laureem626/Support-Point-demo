import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function paginate<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  page = 1,
  pageSize = 10,
): SelectQueryBuilder<T> {
  page = Number(page) || 1;
  pageSize = Number(pageSize) || 10;

  // Prevent invalid values
  if (page < 1) {
    page = 1;
  }

  if (pageSize < 1) {
    pageSize = 10;
  }

  // Maximum 100 records per page
  if (pageSize > 100) {
    pageSize = 100;
  }

  const skip = (page - 1) * pageSize;

  return query.skip(skip).take(pageSize);
}

export function buildPaginationResponse<T>(
  data: T[],
  total: number,
  page = 1,
  pageSize = 10,
  _url?: string,
): PaginationResponse<T> {
  page = Number(page) || 1;
  pageSize = Number(pageSize) || 10;

  if (page < 1) {
    page = 1;
  }

  if (pageSize < 1) {
    pageSize = 10;
  }

  if (pageSize > 100) {
    pageSize = 100;
  }

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}