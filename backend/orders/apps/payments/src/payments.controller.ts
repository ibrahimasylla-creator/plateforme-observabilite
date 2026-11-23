import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

const MAX_DELAY_MS = 10_000;

function parseDelay(value?: string): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX_DELAY_MS) : 0;
}

function isTrue(value?: string): boolean {
  return value === 'true' || value === '1';
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Traiter un paiement simulé (aucune transaction réelle)' })
  @ApiHeader({ name: 'X-Chaos-Delay-Ms', required: false, description: 'Délai artificiel en ms (max 10000)' })
  @ApiHeader({ name: 'X-Chaos-Force-Error', required: false, description: 'true : provoque une erreur 500' })
  @ApiHeader({ name: 'X-Chaos-Drop-Payment', required: false, description: 'true : simule une indisponibilité (503)' })
  create(
    @Body() dto: CreatePaymentDto,
    @Headers('x-chaos-delay-ms') delay?: string,
    @Headers('x-chaos-force-error') forceError?: string,
    @Headers('x-chaos-drop-payment') drop?: string,
  ) {
    return this.paymentsService.process(dto, {
      delayMs: parseDelay(delay),
      forceError: isTrue(forceError),
      dropPayment: isTrue(drop),
    });
  }
}
