import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { traceIdMiddleware } from './trace-id.middleware';

export interface SetupAppOptions {
  title: string;
  description: string;
}

/** Configuration commune à tous les services (gateway, users, orders, payments). */
export function setupApp(app: INestApplication, options: SetupAppOptions): void {
  app.use(traceIdMiddleware);
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    allowedHeaders: ['Content-Type', 'traceparent', 'tracestate'],
    exposedHeaders: ['X-Trace-Id'],
  });

  const config = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
}
