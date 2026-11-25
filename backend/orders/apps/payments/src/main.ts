import { initTelemetry } from '@app/common';
initTelemetry('payments');

import { NestFactory } from '@nestjs/core';
import { JsonNestLogger, setupApp } from '@app/common';
import { PaymentsModule } from './payments.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentsModule, { logger: new JsonNestLogger() });
  setupApp(app, {
    title: 'Service Paiements',
    description: 'Traitement des paiements simulés et injection de pannes',
  });
  await app.listen(process.env.PORT ?? 4003);
}
void bootstrap();
