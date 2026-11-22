import { generateW3CTraceContext, getTracer } from '../telemetry/otel.js'
import { SpanStatusCode } from '@opentelemetry/api'

const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function executeOrderFlow({
  user,
  product,
  quantity,
  scenarioConfig,
  simulationMode,
}) {
  const tracer = getTracer()
  const { traceId, traceparent } = generateW3CTraceContext()
  const startTime = performance.now()
  const amount = product.price * quantity

  return await tracer.startActiveSpan('POST /api/orders', async (span) => {
    span.setAttribute('trace.id', traceId)
    span.setAttribute('test.scenario', scenarioConfig.id)

    try {
      if (!simulationMode) {
        const response = await fetch(`${GATEWAY_URL}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            traceparent,
            'X-Trace-Id': traceId,
            'X-Chaos-Delay-Ms': String(scenarioConfig.delayMs || 0),
            'X-Chaos-Force-Error': String(Boolean(scenarioConfig.forceError)),
            'X-Chaos-Drop-Payment': String(Boolean(scenarioConfig.dropPayment)),
          },
          body: JSON.stringify({
            userId: user.id,
            userName: user.name,
            items: [{ id: product.id, name: product.name, quantity }],
            amount,
          }),
        })

        const durationMs = Math.round(performance.now() - startTime)
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          span.setStatus({ code: SpanStatusCode.ERROR })
          return {
            id: `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
            timestamp: new Date().toLocaleTimeString('fr-FR'),
            user: user.name,
            product: `${product.name} (x${quantity})`,
            amount,
            success: false,
            status: response.status,
            traceId,
            durationMs,
            scenario: scenarioConfig.id,
            message: data.message || `Erreur HTTP ${response.status}`,
            spans: data.spans || buildSpans(durationMs, scenarioConfig, response.status),
            logs: buildLogs(traceId, user, amount, scenarioConfig, response.status),
          }
        }

        span.setStatus({ code: SpanStatusCode.OK })
        return {
          id: data.orderId || `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toLocaleTimeString('fr-FR'),
          user: user.name,
          product: `${product.name} (x${quantity})`,
          amount,
          success: true,
          status: 200,
          traceId,
          durationMs,
          scenario: scenarioConfig.id,
          message: 'Commande validée et enregistrée',
          spans: data.spans || buildSpans(durationMs, scenarioConfig, 200),
          logs: buildLogs(traceId, user, amount, scenarioConfig, 200),
        }
      }

      // Simulation locale fidèle au flux : Gateway -> Commandes -> Users/Paiement -> PostgreSQL
      const baseMs = 45 + Math.floor(Math.random() * 35)
      const delay = Number(scenarioConfig.delayMs || 0)
      await wait(Math.min(baseMs + delay, 3000))

      const durationMs = Math.round(performance.now() - startTime)
      let status = 200
      let message = 'Commande validée et persistée dans PostgreSQL'

      if (scenarioConfig.dropPayment) {
        status = 503
        message = 'Service paiement indisponible (503)'
      } else if (scenarioConfig.forceError) {
        status = 500
        message = 'Erreur interne du service paiement (500)'
      }

      const success = status === 200
      span.setStatus({ code: success ? SpanStatusCode.OK : SpanStatusCode.ERROR })

      return {
        id: `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
        user: user.name,
        product: `${product.name} (x${quantity})`,
        amount,
        success,
        status,
        traceId,
        durationMs,
        scenario: scenarioConfig.id,
        message,
        spans: buildSpans(durationMs, scenarioConfig, status),
        logs: buildLogs(traceId, user, amount, scenarioConfig, status),
      }
    } catch (error) {
      const durationMs = Math.round(performance.now() - startTime)
      span.setStatus({ code: SpanStatusCode.ERROR })
      return {
        id: `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
        user: user.name,
        product: `${product.name} (x${quantity})`,
        amount,
        success: false,
        status: 502,
        traceId,
        durationMs,
        scenario: scenarioConfig.id,
        message: 'API Gateway hors ligne — Activez le mode simulation',
        spans: buildSpans(durationMs, scenarioConfig, 502),
        logs: buildLogs(traceId, user, amount, scenarioConfig, 502),
      }
    } finally {
      span.end()
    }
  })
}

function buildSpans(totalMs, scenarioConfig, status) {
  const delay = Number(scenarioConfig.delayMs || 0)
  const cleanMs = Math.max(20, totalMs - delay)
  const gw = Math.round(cleanMs * 0.15)
  const users = Math.round(cleanMs * 0.2)
  const payment = Math.round(cleanMs * 0.3) + delay
  const db = status === 200 ? Math.max(5, Math.round(cleanMs * 0.2)) : 0

  return [
    { service: 'API Gateway', step: 'POST /api/orders', ms: totalMs, ok: status === 200, offset: 0 },
    { service: 'Service Commandes', step: 'Validation & routage', ms: totalMs - gw, ok: status === 200, offset: gw },
    { service: 'Service Utilisateurs', step: 'Vérification client', ms: users, ok: true, offset: gw + 4 },
    {
      service: 'Service Paiement',
      step: 'Autorisation simulée',
      ms: payment,
      ok: status === 200,
      offset: gw + users + 4,
      slow: delay > 0,
    },
    ...(status === 200
      ? [{ service: 'PostgreSQL', step: 'INSERT orders', ms: db, ok: true, offset: totalMs - db - 2 }]
      : []),
  ]
}

function buildLogs(traceId, user, amount, scenarioConfig, status) {
  const time = new Date().toISOString()
  const entries = [
    {
      time,
      level: 'INFO',
      service: 'api-gateway',
      traceId,
      text: `Requête reçue pour ${user.name} (${amount} €)`,
    },
    {
      time,
      level: 'INFO',
      service: 'users-service',
      traceId,
      text: `Utilisateur ${user.id} vérifié avec succès`,
    },
  ]

  if (scenarioConfig.delayMs > 0) {
    entries.push({
      time,
      level: 'WARN',
      service: 'payment-service',
      traceId,
      text: `Temps de réponse élevé détecté (+${scenarioConfig.delayMs} ms)`,
    })
  }

  if (status === 500) {
    entries.push({
      time,
      level: 'ERROR',
      service: 'payment-service',
      traceId,
      text: `HTTP 500 : Échec simulé du traitement de paiement`,
    })
  } else if (status === 503) {
    entries.push({
      time,
      level: 'ERROR',
      service: 'orders-service',
      traceId,
      text: `HTTP 503 : Service paiement injoignable`,
    })
  } else if (status === 200) {
    entries.push({
      time,
      level: 'INFO',
      service: 'orders-service',
      traceId,
      text: `HTTP 200 : Commande enregistrée dans PostgreSQL`,
    })
  }

  return entries
}
