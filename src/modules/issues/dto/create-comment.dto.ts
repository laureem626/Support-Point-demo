
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  userId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  issueId!: number;

  @ApiProperty({ example: 'This is a comment.' })
  @IsString()
  @IsNotEmpty()
  comments!: string;
}