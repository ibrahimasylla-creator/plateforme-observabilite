import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Response } from 'express';

/** Injecte dans un contrôleur l'identifiant de trace de la requête en cours. */
export const TraceId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string =>
    ctx.switchToHttp().getResponse<Response>().locals.traceId as string,
);

/** Construit un en-tête W3C traceparent pour un appel sortant vers un autre service. */
export function traceparentFor(traceId: string): string {
  return `00-${traceId}-${randomBytes(8).toString('hex')}-01`;
}
