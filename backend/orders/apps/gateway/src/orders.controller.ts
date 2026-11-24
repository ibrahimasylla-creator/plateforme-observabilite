import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { pickChaosHeaders, TraceId } from '@app/common';
import { GatewayService } from './gateway.service';

type RequestHeaders = Record<string, string | string[] | undefined>;

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly gateway: GatewayService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une commande (transmise au service orders)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'userName', 'items', 'amount'],
      example: {
        userId: 'USR-101',
        userName: 'Amadou Diallo',
        items: [{ id: 'PRD-01', name: 'Instance Cloud Standard', quantity: 2 }],
        amount: 240,
      },
    },
  })
  @ApiHeader({ name: 'X-Chaos-Delay-Ms', required: false, description: 'Délai artificiel dans payments (ms)' })
  @ApiHeader({ name: 'X-Chaos-Force-Error', required: false, description: 'true : payments répond 500' })
  @ApiHeader({ name: 'X-Chaos-Drop-Payment', required: false, description: 'true : payments répond 503' })
  create(
    @Body() body: Record<string, unknown>,
    @TraceId() traceId: string,
    @Headers() headers: RequestHeaders,
  ) {
    return this.gateway.forwardToOrders('POST', '', { traceId, chaos: pickChaosHeaders(headers) }, body);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les commandes' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PAID', 'FAILED'] })
  list(
    @TraceId() traceId: string,
    @Headers() headers: RequestHeaders,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.gateway.forwardToOrders(
      'GET',
      '',
      { traceId, chaos: pickChaosHeaders(headers) },
      undefined,
      { userId, status },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: "État d'une commande" })
  get(@Param('id') id: string, @TraceId() traceId: string, @Headers() headers: RequestHeaders) {
    return this.gateway.forwardToOrders('GET', `/${encodeURIComponent(id)}`, {
      traceId,
      chaos: pickChaosHeaders(headers),
    });
  }
}
