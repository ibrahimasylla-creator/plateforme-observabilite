import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { OrdersController } from './orders.controller';
import { GatewayService } from './gateway.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [OrdersController, HealthController],
  providers: [GatewayService],
})
export class GatewayModule {}
