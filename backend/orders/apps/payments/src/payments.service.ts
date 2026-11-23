import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService, PaymentStatus } from '@app/database';
import { CreatePaymentDto } from './dto/create-payment.dto';

export interface ChaosOptions {
  delayMs: number;
  forceError: boolean;
  dropPayment: boolean;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly db: DatabaseService) {}

  async process(dto: CreatePaymentDto, chaos: ChaosOptions) {
    if (chaos.delayMs > 0) {
      this.logger.warn(`Simulated delay injected: ${chaos.delayMs} ms`);
      await new Promise((resolve) => setTimeout(resolve, chaos.delayMs));
    }
    if (chaos.dropPayment) {
      this.logger.warn('Simulated outage injected: payment service unavailable');
      throw new ServiceUnavailableException('Payment service unavailable (simulated)');
    }
    if (chaos.forceError) {
      this.logger.warn('Simulated failure injected: payment processing error');
      throw new InternalServerErrorException('Payment processing failed (simulated)');
    }

    try {
      const payment = await this.db.payment.create({
        data: {
          orderId: dto.orderId,
          amount: dto.amount,
          status: PaymentStatus.SUCCESS,
          reference: `PAY-${randomUUID().slice(0, 8).toUpperCase()}`,
        },
      });
      return { ...payment, amount: Number(payment.amount) };
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2003') {
        throw new NotFoundException(`Order ${dto.orderId} not found`);
      }
      if (code === 'P2002') {
        throw new ConflictException(`A payment already exists for order ${dto.orderId}`);
      }
      throw error;
    }
  }
}
