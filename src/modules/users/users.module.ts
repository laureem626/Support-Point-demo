import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users/users.service';
import { UsersController } from './controllers/users/users.controller';
import { User } from './entities/user.entity';
import { RouterModule } from '@nestjs/core';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    RouterModule.register([
      {
        path: 'users',
        module: UsersModule,
      },
    ]),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule],
})
export class UsersModule {}
