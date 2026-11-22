import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
import { trace } from '@opentelemetry/api'

let tracerProvider = null

export function initTelemetry() {
  if (tracerProvider) return tracerProvider

  const collectorUrl = import.meta.env.VITE_OTEL_COLLECTOR_URL || 'http://localhost:4318/v1/traces'

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: 'orders-frontend',
    [ATTR_SERVICE_VERSION]: '1.0.0',
  })

  tracerProvider = new WebTracerProvider({ resource })
  tracerProvider.addSpanProcessor(
    new BatchSpanProcessor(new OTLPTraceExporter({ url: collectorUrl }))
  )
  tracerProvider.register({
    propagator: new W3CTraceContextPropagator(),
  })

  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [/.*/],
        clearTimingResources: true,
      }),
    ],
  })

  return tracerProvider
}

export function generateW3CTraceContext() {
  const hex = (len) =>
    Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  const traceId = hex(32)
  const spanId = hex(16)
  return {
    traceId,
    spanId,
    traceparent: `00-${traceId}-${spanId}-01`,
  }
}

export function getTracer() {
  return trace.getTracer('orders-frontend-tracer', '1.0.0')
}
