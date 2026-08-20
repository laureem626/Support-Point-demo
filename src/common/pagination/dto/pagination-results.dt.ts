import { PageMetaDto } from './page-meta.dto';

export interface PaginationResult<T> {
  data: T[];
  meta: PageMetaDto;
}
