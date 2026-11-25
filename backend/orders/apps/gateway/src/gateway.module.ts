import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { OrdersController } from './orders.controller';
import { UsersController } from './users.controller';
import { GatewayService } from './gateway.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [OrdersController, UsersController, HealthController],
  providers: [GatewayService],
})
export class GatewayModule {}
