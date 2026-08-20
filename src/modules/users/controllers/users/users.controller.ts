import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from '../../services/users/users.service';
import { CreateUserDto } from '../../dtos/create-user.dto';
import { User } from '../../entities/user.entity';
import { Public } from '../../../../common/decorators/is-public-route.decorator';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<{ user: User }> {
    return this.usersService.create(createUserDto);
  }
}
