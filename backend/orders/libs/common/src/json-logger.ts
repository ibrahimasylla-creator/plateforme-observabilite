import { ConsoleLogger, LogLevel } from '@nestjs/common';
import { context, trace } from '@opentelemetry/api';
import type { NextFunction, Request, Response } from 'express';

export interface StructuredLogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  traceId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  context?: string;
}

function getServiceName(): string {
  return process.env.OTEL_SERVICE_NAME || process.env.APP_NAME || 'backend-service';
}

function getActiveTraceId(): string | undefined {
  const span = trace.getSpan(context.active());
  const traceId = span?.spanContext().traceId;
  return traceId && traceId !== '0'.repeat(32) ? traceId : undefined;
}

export function writeJsonLog(entry: Omit<StructuredLogEntry, 'timestamp' | 'service'>): void {
  const payload: StructuredLogEntry = {
    timestamp: new Date().toISOString(),
    service: getServiceName(),
    traceId: entry.traceId ?? getActiveTraceId(),
    ...entry,
  };
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

export class JsonNestLogger extends ConsoleLogger {
  override log(message: unknown, contextName?: string): void {
    writeJsonLog({ level: 'info', message: String(message), context: contextName });
  }

  override warn(message: unknown, contextName?: string): void {
    writeJsonLog({ level: 'warn', message: String(message), context: contextName });
  }

  override error(message: unknown, stackOrContext?: string, contextName?: string): void {
    writeJsonLog({
      level: 'error',
      message: stackOrContext ? `${String(message)} | ${stackOrContext}` : String(message),
      context: contextName ?? stackOrContext,
    });
  }

  override debug(message: unknown, contextName?: string): void {
    writeJsonLog({ level: 'debug', message: String(message), context: contextName });
  }

  override verbose(message: unknown, contextName?: string): void {
    writeJsonLog({ level: 'verbose', message: String(message), context: contextName });
  }

  override setLogLevels(_levels: LogLevel[]): void {}
}

export function httpJsonLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/metrics') {
    next();
    return;
  }

  const start = performance.now();
  res.on('finish', () => {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    writeJsonLog({
      level,
      message: `${req.method} ${req.originalUrl} ${statusCode}`,
      traceId: (res.locals.traceId as string | undefined) ?? getActiveTraceId(),
      method: req.method,
      path: req.originalUrl,
      statusCode,
      durationMs,
    });
  });

  next();
}
