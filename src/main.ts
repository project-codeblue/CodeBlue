import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);

  // cors
  app.enableCors();

  const port = parseInt(process.env.PORT);
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
bootstrap();
