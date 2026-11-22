import { NestFactory } from '@nestjs/core';
import { setupApp } from '@app/common';
import { UsersModule } from './users.module';

async function bootstrap() {
  const app = await NestFactory.create(UsersModule);
  setupApp(app, {
    title: 'Service Utilisateurs',
    description: "Gestion des utilisateurs de test",
  });
  await app.listen(process.env.PORT ?? 4001);
}
void bootstrap();
