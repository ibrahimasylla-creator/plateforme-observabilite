import {
  GatewayTimeoutException,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { traceparentFor } from './trace-context';

export interface CallOptions {
  service: string;
  method: string;
  url: string;
  traceId: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

const CHAOS_HEADERS = ['x-chaos-delay-ms', 'x-chaos-force-error', 'x-chaos-drop-payment'];

/** Ne retient que les en-têtes de simulation de panne, pour les transmettre aux services. */
export function pickChaosHeaders(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const chaos: Record<string, string> = {};
  for (const name of CHAOS_HEADERS) {
    const value = headers[name];
    if (typeof value === 'string') {
      chaos[name] = value;
    }
  }
  return chaos;
}

/**
 * Appel HTTP vers un autre service avec propagation du contexte de trace (W3C traceparent).
 * Une réponse en erreur est renvoyée telle quelle (même code, même message) ;
 * un service injoignable donne 503, un service trop lent donne 504.
 */
export async function callService<T = unknown>(options: CallOptions): Promise<T> {
  const { service, method, url, traceId, body, headers = {}, timeoutMs = 15_000 } = options;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      traceparent: traceparentFor(traceId),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  }).catch((error: unknown) => {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new GatewayTimeoutException(`${service} service timed out`);
    }
    throw new ServiceUnavailableException(`${service} service unreachable`);
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
  return data as T;
}
