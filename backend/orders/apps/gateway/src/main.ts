import { initTelemetry } from '@app/common';
initTelemetry('gateway');

import { NestFactory } from '@nestjs/core';
import { JsonNestLogger, setupApp } from '@app/common';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule, { logger: new JsonNestLogger() });
  setupApp(app, {
    title: 'API Gateway',
    description: "Point d'entrée unique pour le frontend",
  });
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
