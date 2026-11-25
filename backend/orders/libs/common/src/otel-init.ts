import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | null = null;

export function initTelemetry(defaultServiceName: string): void {
  if (sdk) return;

  const serviceName = process.env.OTEL_SERVICE_NAME || process.env.APP_NAME || defaultServiceName;
  const baseUrl = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318').replace(/\/$/, '');

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${baseUrl}/v1/traces`,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
      }),
    ],
  });

  sdk.start();
}
