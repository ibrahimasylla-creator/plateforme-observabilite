import { NestFactory } from '@nestjs/core';
import { setupApp } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app, {
    title: 'Service Commandes',
    description: 'Création et suivi des commandes',
  });
  await app.listen(process.env.PORT ?? 4002);
}
void bootstrap();
