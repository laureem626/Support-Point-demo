import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { AppController } from './app.controller';
import { AppService } from './app.service';


@Module({
  
  controllers: [AppController],
  providers: [AppService],
=======
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsUniqueConstraint } from './common/validators/is-unique.validator';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { join } from 'path';
import { config } from './config/config';
import typeorm from './config/typeorm';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // Corrected here
      exclude: ['api/(.*)'],
      serveRoot: '/uploads',
    }),

    //cron job module
    ScheduleModule.forRoot(),

    //Config for db connections
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) =>
        configService.getOrThrow('typeorm'),
      inject: [ConfigService],
    }),

    //Config for environment Variable and typeorm ds
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config, typeorm],
    }),

    UsersModule,
  ],
  providers: [IsUniqueConstraint],
>>>>>>> d053ebd (implementing users module)
})
export class AppModule {}
