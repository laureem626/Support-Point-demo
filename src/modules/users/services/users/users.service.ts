import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../../dtos/create-user.dto';
import { hashPassword } from '../../../../common/utils/password-hash';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<{ user: User }> {
    //Hash the user's password
    const hashedPassword = await hashPassword(createUserDto.password);

    // Create a new user entity with hashed password and profile image path
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // Save the user entity to the database
    const savedUser = await this.usersRepository.save(user);

    // Remove password from the response without mutating the entity
    const { password, ...userWithoutPassword } = savedUser;

    return {
      user: savedUser,
    };
  }
}
