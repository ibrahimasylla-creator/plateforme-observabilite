import type { NextFunction, Request, Response } from 'express';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

const serviceName = process.env.OTEL_SERVICE_NAME || process.env.APP_NAME || 'backend-service';
const register = new Registry();
register.setDefaultLabels({ service: serviceName });

collectDefaultMetrics({ register });

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/metrics') {
    res.setHeader('Content-Type', register.contentType);
    void register.metrics().then((output) => res.send(output));
    return;
  }

  const endTimer = httpRequestDurationSeconds.startTimer();
  res.on('finish', () => {
    const route = req.route?.path ? `${req.baseUrl}${String(req.route.path)}` : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };
    httpRequestsTotal.inc(labels);
    endTimer(labels);
  });

  next();
}
