import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users/users.service';
import { UsersController } from './controllers/users/users.controller';
import { User } from './entities/user.entity';
import { Designation } from './entities/designation.entity';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Designation]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule],
})
export class UsersModule {}
