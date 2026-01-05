import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { BadRequestException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  const cookiePlugin = (await import('@fastify/cookie')).default;
  await app.register(cookiePlugin);

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Gym ERP API')
    .setDescription('API documentation for the Gym ERP system')
    .setVersion('1.0')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
    })
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('tenants', 'Tenant management endpoints')
    .addTag('roles', 'Role management endpoints')
    .addTag('people', 'People management endpoints')
    .addTag('taxes', 'Tax configuration endpoints')
    .addTag('platform', 'Platform administration endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(
    `Swagger documentation available at: ${await app.getUrl()}/api/docs`,
  );
}
void bootstrap();
