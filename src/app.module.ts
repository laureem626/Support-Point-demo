import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsUniqueConstraint } from './common/validators/is-unique.validator';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { join } from 'path';
import { config } from './config/config';
import typeorm from './config/typeorm';
import { AuthModule } from './modules/auth/auth.module';

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
    AuthModule,
  ],
  providers: [IsUniqueConstraint],
})
export class AppModule {}
