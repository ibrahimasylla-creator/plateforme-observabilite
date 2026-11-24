import { Injectable } from '@nestjs/common';
import { callService } from '@app/common';

export interface ForwardContext {
  traceId: string;
  chaos: Record<string, string>;
}

const GATEWAY_TIMEOUT_MS = 30_000;

@Injectable()
export class GatewayService {
  private readonly ordersUrl = process.env.ORDERS_URL ?? 'http://localhost:4002';

  /** Transmet une requête au service orders, en gardant la même trace. */
  forwardToOrders(
    method: string,
    path: string,
    ctx: ForwardContext,
    body?: unknown,
    query?: Record<string, string | undefined>,
  ) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== '') {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    return callService({
      service: 'orders',
      method,
      url: `${this.ordersUrl}/api/orders${path}${qs ? `?${qs}` : ''}`,
      traceId: ctx.traceId,
      body,
      headers: ctx.chaos,
      timeoutMs: GATEWAY_TIMEOUT_MS,
    });
  }

  async isOrdersUp(): Promise<boolean> {
    return fetch(`${this.ordersUrl}/api/health`, { signal: AbortSignal.timeout(2000) })
      .then((response) => response.ok)
      .catch(() => false);
  }
}
