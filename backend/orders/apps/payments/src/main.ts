import { NestFactory } from '@nestjs/core';
import { setupApp } from '@app/common';
import { PaymentsModule } from './payments.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentsModule);
  setupApp(app, {
    title: 'Service Paiements',
    description: 'Paiement simulé : aucune transaction réelle',
  });
  await app.listen(process.env.PORT ?? 4003);
}
void bootstrap();
