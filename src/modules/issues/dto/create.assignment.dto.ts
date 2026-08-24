
import { IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssignmentDto {
  @ApiProperty    ({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  userId!: number;

  @ApiProperty    ({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  issueUuid!: string;

  @ApiProperty    ({ example: 'This is an assignment.' })
  @IsString()
  @IsNotEmpty()
  description!: string;
}