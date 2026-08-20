import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { seedSystemAdmin } from '../src/db/seeders/system-admin.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  await seedSystemAdmin(dataSource); // add here

  await app.close();
}

bootstrap();
