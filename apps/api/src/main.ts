import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(import('@fastify/cors'), {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      disableErrorMessages: false,
      exceptionFactory: (errors) => {
        const result: Record<string, string[]> = {};
        errors.forEach((error) => {
          if (error.constraints) {
            result[error.property] = Object.values(error.constraints);
          }
        });
        return new BadRequestException({
          message: 'Validation failed',
          errors: result,
        });
      },
    }),
  );
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    // We will register the UserContextInterceptor in AppModule or via useGlobalInterceptors if it doesn't need DI.
    // However, ClsService is injectable. So we should probably register it in AppModule as a provider with APP_INTERCEPTOR.
    // But for now, let's stick to the plan of refactoring entities first.
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.register(import('@fastify/cookie') as any);

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();
