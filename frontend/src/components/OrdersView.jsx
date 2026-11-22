import React, { useState } from 'react'
import { Send, Plus, Zap, CheckCircle2, AlertCircle, Clock, PowerOff } from 'lucide-react'

const PRODUCTS = [
  { id: 'PRD-01', name: 'Instance Cloud Standard', price: 120 },
  { id: 'PRD-02', name: 'Base PostgreSQL Managée', price: 90 },
  { id: 'PRD-03', name: 'Stockage NVMe 500 Go', price: 45 },
]

const SCENARIOS = [
  {
    id: 'ST01',
    title: 'Normal',
    desc: 'Exécution standard sans anomalie',
    icon: CheckCircle2,
    delayMs: 0,
    forceError: false,
    dropPayment: false,
  },
  {
    id: 'ST02',
    title: 'Erreur 500',
    desc: 'Panne applicative sur le paiement',
    icon: AlertCircle,
    delayMs: 0,
    forceError: true,
    dropPayment: false,
  },
  {
    id: 'ST03',
    title: 'Lenteur (+2s)',
    desc: 'Délai artificiel pour tracer le goulot',
    icon: Clock,
    delayMs: 2000,
    forceError: false,
    dropPayment: false,
  },
  {
    id: 'ST04',
    title: 'Service coupé',
    desc: 'Indisponibilité paiement (HTTP 503)',
    icon: PowerOff,
    delayMs: 0,
    forceError: false,
    dropPayment: true,
  },
]

export default function OrdersView({
  users,
  selectedUser,
  setSelectedUser,
  onAddUser,
  onSendOrder,
  onRunBatch,
  isLoading,
  lastOrder,
  onOpenTraces,
}) {
  const [productId, setProductId] = useState(PRODUCTS[0].id)
  const [quantity, setQuantity] = useState(1)
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0])
  const [batchSize, setBatchSize] = useState(10)

  const [showNewUser, setShowNewUser] = useState(false)
  const [newUserName, setNewUserName] = useState('')

  const currentProduct = PRODUCTS.find((p) => p.id === productId) || PRODUCTS[0]
  const totalAmount = currentProduct.price * quantity

  const handleCreateUser = (e) => {
    e.preventDefault()
    if (!newUserName.trim()) return
    onAddUser({
      id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      name: newUserName.trim(),
    })
    setNewUserName('')
    setShowNewUser(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Colonne principale : Formulaire de commande & scénario */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Nouvelle commande distribuée</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Déclenche le parcours : Gateway → Commandes → Utilisateurs / Paiement → PostgreSQL
          </p>
        </div>

        {/* Sélection ou création client */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Client de test</label>
            <button
              type="button"
              onClick={() => setShowNewUser(!showNewUser)}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouveau client
            </button>
          </div>

          {showNewUser ? (
            <form onSubmit={handleCreateUser} className="flex gap-2">
              <input
                type="text"
                placeholder="Nom complet (ex: Awa Ndiaye)"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
              >
                Ajouter
              </button>
            </form>
          ) : (
            <select
              value={selectedUser.id}
              onChange={(e) => {
                const found = users.find((u) => u.id === e.target.value)
                if (found) setSelectedUser(found)
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.id})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Produit & Quantité */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Article</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              {PRODUCTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.price} €
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Quantité</label>
            <input
              type="number"
              min="1"
              max="20"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Scénario de test (§8) */}
        <div className="space-y-2.5">
          <label className="text-sm font-medium text-slate-700 block">
            Comportement simulé (Scénario de test)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SCENARIOS.map((sc) => {
              const Icon = sc.icon
              const selected = activeScenario.id === sc.id
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setActiveScenario(sc)}
                  className={`p-3 rounded-xl border text-left transition ${
                    selected
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Icon className={`w-4 h-4 ${selected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>
                      {sc.id} · {sc.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{sc.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Bouton d'envoi principal */}
        <div className="pt-2 flex items-center justify-between gap-4 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-500 block">Total commande</span>
            <span className="text-xl font-bold text-slate-900">{totalAmount} €</span>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={() =>
              onSendOrder({
                product: currentProduct,
                quantity,
                scenarioConfig: activeScenario,
              })
            }
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl text-sm shadow-sm transition"
          >
            <Send className="w-4 h-4" />
            {isLoading ? 'Exécution...' : 'Envoyer la commande'}
          </button>
        </div>
      </div>

      {/* Colonne secondaire : Test de charge + Résultat immédiat */}
      <div className="lg:col-span-5 space-y-6">
        {/* Dernier résultat */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Dernière exécution</h3>

          {!lastOrder ? (
            <p className="text-sm text-slate-400 py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Aucune requête lancée pour l&apos;instant.
            </p>
          ) : (
            <div className="space-y-4">
              <div
                className={`p-3.5 rounded-xl border text-sm ${
                  lastOrder.success
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/70 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>
                    HTTP {lastOrder.status} · {lastOrder.scenario}
                  </span>
                  <span>{lastOrder.durationMs} ms</span>
                </div>
                <p className="text-xs mt-1 opacity-90">{lastOrder.message}</p>
              </div>

              <div className="text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">TraceID W3C :</span>
                  <span className="font-mono text-slate-800">{lastOrder.traceId.slice(0, 18)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Commande :</span>
                  <span className="font-medium text-slate-800">{lastOrder.id}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenTraces}
                className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-indigo-600 transition"
              >
                Voir le détail de la trace &amp; les logs →
              </button>
            </div>
          )}
        </div>

        {/* Montée en charge ST05 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Test de montée en charge (ST05)
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Génère une rafale reproductible de requêtes avec le scénario actif pour évaluer ELK et OpenSearch.
          </p>

          <div className="flex items-center gap-2.5">
            <input
              type="number"
              min="5"
              max="100"
              value={batchSize}
              onChange={(e) => setBatchSize(Math.min(100, Math.max(5, Number(e.target.value))))}
              className="w-20 rounded-xl border border-slate-300 px-3 py-2 text-sm text-center font-medium"
            />
            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                onRunBatch(batchSize, {
                  product: currentProduct,
                  quantity: 1,
                  scenarioConfig: activeScenario,
                })
              }
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium transition"
            >
              Lancer {batchSize} requêtes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
