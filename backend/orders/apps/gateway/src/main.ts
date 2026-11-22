import { NestFactory } from '@nestjs/core';
import { setupApp } from '@app/common';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  setupApp(app, {
    title: 'API Gateway',
    description: "Point d'entrée unique pour le frontend",
  });
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
