import { randomBytes } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const TRACEPARENT = /^[\da-f]{2}-([\da-f]{32})-[\da-f]{16}-[\da-f]{2}$/i;
const EMPTY_TRACE_ID = '0'.repeat(32);

/**
 * Attache un identifiant de trace à chaque requête (res.locals.traceId)
 * et le renvoie dans l'en-tête X-Trace-Id.
 * Reprend celui de l'en-tête W3C "traceparent" s'il est valide, sinon en génère un.
 * Sera remplacé par l'identifiant du span OpenTelemetry actif (sujet B).
 */
export function traceIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers['traceparent'];
  let traceId: string | undefined;

  if (typeof header === 'string') {
    const match = TRACEPARENT.exec(header.trim());
    if (match && match[1] !== EMPTY_TRACE_ID) {
      traceId = match[1].toLowerCase();
    }
  }

  traceId ??= randomBytes(16).toString('hex');
  res.locals.traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);
  next();
}
