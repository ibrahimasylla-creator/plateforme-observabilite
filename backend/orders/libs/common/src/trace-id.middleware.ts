import { context, trace } from '@opentelemetry/api';
import { randomBytes } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const TRACEPARENT = /^[\da-f]{2}-([\da-f]{32})-[\da-f]{16}-[\da-f]{2}$/i;
const EMPTY_TRACE_ID = '0'.repeat(32);

export function traceIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const activeSpan = trace.getSpan(context.active());
  const otelTraceId = activeSpan?.spanContext().traceId;

  let traceId: string | undefined =
    otelTraceId && otelTraceId !== EMPTY_TRACE_ID ? otelTraceId.toLowerCase() : undefined;

  if (!traceId) {
    const header = req.headers['traceparent'];
    if (typeof header === 'string') {
      const match = TRACEPARENT.exec(header.trim());
      if (match && match[1] !== EMPTY_TRACE_ID) {
        traceId = match[1].toLowerCase();
      }
    }
  }

  traceId ??= randomBytes(16).toString('hex');
  res.locals.traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);
  next();
}
