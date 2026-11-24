import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GatewayService } from './gateway.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly gateway: GatewayService) {}

  @Get()
  async check() {
    const ordersUp = await this.gateway.isOrdersUp();
    return { status: 'ok', service: 'gateway', orders: ordersUp ? 'up' : 'down' };
  }
}
