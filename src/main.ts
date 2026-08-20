import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Specify the max size of request body size
  app.use(bodyParser.json({ limit: '2mb' }));
  app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));

  app.enableCors();

  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // app.useStaticAssets(join(__dirname, '..', 'media'), {
  //   prefix: '/media/',
  // });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
