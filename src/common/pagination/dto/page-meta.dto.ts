import { PaginationOptionsDto } from './pagination-options.dto';

export interface PageMetaDtoParameters {
  pageOptionsDto: PaginationOptionsDto;
  itemCount: number;
}

export class PageMetaDto {
  readonly page: number;
  readonly pageSize: number;
  readonly itemCount: number;
  readonly pageCount: number;
  readonly nextLink?: string; // Optional next link
  readonly prevLink?: string; // Optional previous link

  constructor({
    pageOptionsDto,
    itemCount,
    baseUrl,
  }: PageMetaDtoParameters & { baseUrl: string }) {
    this.page = pageOptionsDto.page!;
    this.pageSize = pageOptionsDto.pageSize!;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / this.pageSize);
    const hasPreviousPage: boolean = this.page > 1;
    const hasNextPage: boolean = this.page < this.pageCount;

    // Validate if the requested page is larger than available pages
    // if (this.page > this.pageCount) {
    //   throw new NotFoundException('Requested page not found');
    // }

    // Construct next and previous links
    this.nextLink = hasNextPage
      ? `${baseUrl}?page=${this.page + 1}&pageSize=${this.pageSize}`
      : undefined;

    this.prevLink = hasPreviousPage
      ? `${baseUrl}?page=${this.page - 1}&pageSize=${this.pageSize}`
      : undefined;
  }
}
