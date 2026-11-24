import {
  GatewayTimeoutException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { traceparentFor } from '@app/common';
import { DatabaseService, Order, OrderStatus, Payment } from '@app/database';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';

export interface RequestContext {
  traceId: string;
  chaos: Record<string, string>;
}

type OrderWithPayment = Order & { payment: Payment | null };

const CALL_TIMEOUT_MS = 15_000;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly usersUrl = process.env.USERS_URL ?? 'http://localhost:4001';
  private readonly paymentsUrl = process.env.PAYMENTS_URL ?? 'http://localhost:4003';

  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateOrderDto, ctx: RequestContext) {
    // 1. S'assurer que l'utilisateur existe (appel au service users)
    await this.call(
      'users',
      'PUT',
      `${this.usersUrl}/api/users/${encodeURIComponent(dto.userId)}`,
      { name: dto.userName },
      ctx,
      false,
    );

    // 2. Enregistrer la commande en attente
    const order = await this.db.order.create({
      data: {
        userId: dto.userId,
        items: dto.items.map(({ id, name, quantity }) => ({ id, name, quantity })),
        amount: dto.amount,
        traceId: ctx.traceId,
      },
    });
    this.logger.log(`Order ${order.id} created (PENDING) for user ${dto.userId}, amount ${dto.amount}`);

    // 3. Demander le paiement (appel au service payments, qui peut échouer à la demande)
    try {
      await this.call(
        'payments',
        'POST',
        `${this.paymentsUrl}/api/payments`,
        { orderId: order.id, amount: dto.amount },
        ctx,
        true,
      );
    } catch (error) {
      await this.db.order.update({ where: { id: order.id }, data: { status: OrderStatus.FAILED } });
      this.logger.warn(`Order ${order.id} marked FAILED (${this.describe(error)})`);
      throw error;
    }

    // 4. Paiement accepté : la commande passe à PAID
    const paid = await this.db.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID },
      include: { payment: true },
    });
    this.logger.log(`Order ${order.id} PAID`);
    return { ...this.toView(paid), message: 'Order validated and recorded' };
  }

  async get(id: string) {
    const order = await this.db.order.findUnique({ where: { id }, include: { payment: true } });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return this.toView(order);
  }

  async list(query: ListOrdersQueryDto) {
    const orders = await this.db.order.findMany({
      where: { userId: query.userId, status: query.status },
      include: { payment: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return orders.map((order) => this.toView(order));
  }

  /** Appel HTTP vers un autre service, avec propagation du contexte de trace. */
  private async call(
    service: string,
    method: string,
    url: string,
    body: unknown,
    ctx: RequestContext,
    withChaos: boolean,
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      traceparent: traceparentFor(ctx.traceId),
    };
    if (withChaos) {
      Object.assign(headers, ctx.chaos);
    }

    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    }).catch((error: unknown) => {
      throw this.networkError(service, error);
    });

    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
      error?: string;
    };
    if (!response.ok) {
      throw new HttpException(
        { message: data.message ?? `${service} service error`, error: data.error ?? 'Upstream Error' },
        response.status,
      );
    }
    return data;
  }

  private networkError(service: string, error: unknown): HttpException {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return new GatewayTimeoutException(`${service} service timed out`);
    }
    return new ServiceUnavailableException(`${service} service unreachable`);
  }

  private describe(error: unknown): string {
    if (error instanceof HttpException) {
      return `${error.getStatus()} ${JSON.stringify(error.getResponse())}`;
    }
    return error instanceof Error ? error.message : String(error);
  }

  private toView(order: OrderWithPayment) {
    return {
      orderId: order.id,
      userId: order.userId,
      items: order.items,
      amount: Number(order.amount),
      status: order.status,
      traceId: order.traceId,
      createdAt: order.createdAt,
      payment: order.payment
        ? { reference: order.payment.reference, status: order.payment.status }
        : null,
    };
  }
}
