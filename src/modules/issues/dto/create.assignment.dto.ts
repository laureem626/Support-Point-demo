
import { IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateAssignmentDto {
  @IsInt()
  @IsNotEmpty()
  userId!: number;

  @IsUUID()
  @IsNotEmpty()
  issueUuid!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}