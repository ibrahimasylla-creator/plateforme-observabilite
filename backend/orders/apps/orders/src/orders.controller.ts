import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TraceId } from '@app/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OrdersService } from './orders.service';

const CHAOS_HEADERS = ['x-chaos-delay-ms', 'x-chaos-force-error', 'x-chaos-drop-payment'];

/** Ne retient que les en-têtes de simulation de panne, pour les transmettre au service payments. */
function pickChaosHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string> {
  const chaos: Record<string, string> = {};
  for (const name of CHAOS_HEADERS) {
    const value = headers[name];
    if (typeof value === 'string') {
      chaos[name] = value;
    }
  }
  return chaos;
}

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une commande (utilisateur, enregistrement, paiement simulé)' })
  @ApiHeader({ name: 'X-Chaos-Delay-Ms', required: false, description: 'Délai artificiel dans payments (ms)' })
  @ApiHeader({ name: 'X-Chaos-Force-Error', required: false, description: 'true : payments répond 500' })
  @ApiHeader({ name: 'X-Chaos-Drop-Payment', required: false, description: 'true : payments répond 503' })
  create(
    @Body() dto: CreateOrderDto,
    @TraceId() traceId: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.ordersService.create(dto, { traceId, chaos: pickChaosHeaders(headers) });
  }

  @Get()
  @ApiOperation({ summary: 'Lister les commandes (filtres : userId, status)' })
  list(@Query() query: ListOrdersQueryDto) {
    return this.ordersService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "État d'une commande, avec son paiement" })
  get(@Param('id') id: string) {
    return this.ordersService.get(id);
  }
}
