import { initTelemetry } from '@app/common';
initTelemetry('users');

import { NestFactory } from '@nestjs/core';
import { JsonNestLogger, setupApp } from '@app/common';
import { UsersModule } from './users.module';

async function bootstrap() {
  const app = await NestFactory.create(UsersModule, { logger: new JsonNestLogger() });
  setupApp(app, {
    title: 'Service Utilisateurs',
    description: 'Gestion et création à la volée des utilisateurs',
  });
  await app.listen(process.env.PORT ?? 4001);
}
void bootstrap();
