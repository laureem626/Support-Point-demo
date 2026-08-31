
import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssignedTo } from 'src/common/enums/issue.enum';

export class CreateCommentDto {
 @ApiProperty({ enum: AssignedTo, })
   @IsEnum(AssignedTo)
   @IsNotEmpty()
   assignedTo: AssignedTo;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  issueId!: number;

  @ApiProperty({ example: 'This is a comment.' })
  @IsString()
  @IsNotEmpty()
  comments!: string;
}