
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsInt()
  @IsNotEmpty()
  userId!: number;

  @IsInt()
  @IsNotEmpty()
  issueId!: number;

  @IsString()
  @IsNotEmpty()
  comments!: string;
}