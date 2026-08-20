import { BadRequestException } from '@nestjs/common';

export async function validateAndSort(
  queryBuilder: any,
  orderBy: string,
  sortOrder: 'ASC' | 'DESC',
  alias: string,
  validSortFields: string[],
) {
  // Allow sorting only if it's a valid field or 'createdAt'
  if (!validSortFields.includes(orderBy) && orderBy !== 'createdAt') {
    throw new BadRequestException(
      `Invalid orderBy field: ${orderBy}. Allowed fields are: ${validSortFields.join(', ')}`,
    );
  }

  // Apply sorting to the query builder using the dynamic alias
  queryBuilder.orderBy(`${alias}.${orderBy}`, sortOrder);
}
