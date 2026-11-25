import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { pickChaosHeaders, TraceId } from '@app/common';
import { GatewayService } from './gateway.service';

type RequestHeaders = Record<string, string | string[] | undefined>;

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly gateway: GatewayService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les utilisateurs réels en base PostgreSQL' })
  list(@TraceId() traceId: string, @Headers() headers: RequestHeaders) {
    return this.gateway.forwardToUsers('GET', '', { traceId, chaos: pickChaosHeaders(headers) });
  }

  @Post()
  @ApiOperation({ summary: 'Créer un utilisateur réel en base PostgreSQL' })
  create(@Body() body: Record<string, unknown>, @TraceId() traceId: string, @Headers() headers: RequestHeaders) {
    return this.gateway.forwardToUsers('POST', '', { traceId, chaos: pickChaosHeaders(headers) }, body);
  }
}
