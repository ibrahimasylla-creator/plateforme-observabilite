import { generateW3CTraceContext, getTracer } from '../telemetry/otel.js'
import { SpanStatusCode } from '@opentelemetry/api'

const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:4000'

export async function fetchOrdersHistory() {
  try {
    const response = await fetch(`${GATEWAY_URL}/api/orders`)
    if (!response.ok) return []
    const orders = await response.json()
    if (!Array.isArray(orders)) return []

    return orders.map((order) => {
      const itemsLabel = Array.isArray(order.items) && order.items.length > 0
        ? order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')
        : 'Commande distribuée'
      const isPaid = order.status === 'PAID' || order.status === 'COMPLETED'
      return {
        id: order.orderId || order.id,
        timestamp: order.createdAt
          ? new Date(order.createdAt).toLocaleTimeString('fr-FR')
          : new Date().toLocaleTimeString('fr-FR'),
        user: order.userId || 'Client',
        product: itemsLabel,
        amount: Number(order.amount || 0),
        success: isPaid,
        status: isPaid ? 201 : 500,
        traceId: order.traceId || 'n/a',
        durationMs: Number(order.durationMs || 45),
        scenario: isPaid ? 'ST01' : 'ST02',
        message: isPaid
          ? `Commande validée (${order.payment?.reference || 'PostgreSQL'})`
          : `Échec paiement (${order.status})`,
        spans: [],
        logs: [],
      }
    })
  } catch {
    return []
  }
}

export async function executeOrderFlow({
  user,
  product,
  quantity,
  scenarioConfig,
}) {
  const tracer = getTracer()
  const { traceId, traceparent } = generateW3CTraceContext()
  const startTime = performance.now()
  const amount = product.price * quantity

  return await tracer.startActiveSpan('POST /api/orders', async (span) => {
    span.setAttribute('trace.id', traceId)
    span.setAttribute('test.scenario', scenarioConfig.id)

    try {
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
      const effectiveTraceId = response.headers.get('X-Trace-Id') || data.traceId || traceId

      if (!response.ok) {
        span.setStatus({ code: SpanStatusCode.ERROR })
        return {
          id: data.orderId || `ERR-${response.status}`,
          timestamp: new Date().toLocaleTimeString('fr-FR'),
          user: user.name,
          product: `${product.name} (x${quantity})`,
          amount,
          success: false,
          status: response.status,
          traceId: effectiveTraceId,
          durationMs,
          scenario: scenarioConfig.id,
          message: data.message || `Erreur HTTP ${response.status} retournée par le backend`,
          spans: data.spans || [],
          logs: [],
        }
      }

      span.setStatus({ code: SpanStatusCode.OK })
      return {
        id: data.orderId || data.id,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
        user: user.name,
        product: `${product.name} (x${quantity})`,
        amount,
        success: true,
        status: response.status,
        traceId: effectiveTraceId,
        durationMs,
        scenario: scenarioConfig.id,
        message: `Persisté dans PostgreSQL (${data.payment?.reference || 'OK'})`,
        spans: data.spans || [],
        logs: [],
      }
    } catch (error) {
      const durationMs = Math.round(performance.now() - startTime)
      span.setStatus({ code: SpanStatusCode.ERROR })
      return {
        id: 'ERR-GATEWAY',
        timestamp: new Date().toLocaleTimeString('fr-FR'),
        user: user.name,
        product: `${product.name} (x${quantity})`,
        amount,
        success: false,
        status: 502,
        traceId,
        durationMs,
        scenario: scenarioConfig.id,
        message: `Erreur réseau vers l'API Gateway (${GATEWAY_URL}) : ${error.message}`,
        spans: [],
        logs: [],
      }
    } finally {
      span.end()
    }
  })
}

export async function fetchUsers() {
  try {
    const response = await fetch(`${GATEWAY_URL}/api/users`)
    if (!response.ok) return []
    const users = await response.json()
    return Array.isArray(users) ? users : []
  } catch {
    return []
  }
}

export async function createUser({ name, email }) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+ /g, '.')
  const response = await fetch(`${GATEWAY_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email: email || `${slug}.${Math.floor(100 + Math.random() * 900)}@observability.local`,
    }),
  })
  if (!response.ok) {
    throw new Error(`Erreur création utilisateur (${response.status})`)
  }
  return await response.json()
}
