import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  if (
    !process.env.JWT_SECRET ||
    !process.env.JWT_EXPIRES_IN ||
    !process.env.JWT_REFRESH_SECRET ||
    !process.env.JWT_REFRESH_EXPIRES_IN
  ) {
    const err = new Error(
      'JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET and JWT_REFRESH_EXPIRES_IN must be set',
    );
    logger.error(err.message);
    throw err;
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = Number(process.env.PORT) || 10000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application listening on port ${port}`);
}
bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', err instanceof Error ? err.stack : String(err));
  process.exit(1);
});