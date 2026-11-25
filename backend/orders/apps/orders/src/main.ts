import { initTelemetry } from '@app/common';
initTelemetry('orders');

import { NestFactory } from '@nestjs/core';
import { JsonNestLogger, setupApp } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new JsonNestLogger() });
  setupApp(app, {
    title: 'Service Commandes',
    description: 'Création et suivi des commandes',
  });
  await app.listen(process.env.PORT ?? 4002);
}
void bootstrap();
