import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:9000',
    credentials: true,
    methods: 'GET,PUT,POST,DELETE',
    optionsSuccessStatus: 200,
    allowedHeaders:
      'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe',
  });
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
