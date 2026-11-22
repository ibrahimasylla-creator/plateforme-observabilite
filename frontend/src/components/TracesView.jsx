import React, { useState } from 'react'
import { Copy, Check, Search } from 'lucide-react'

export default function TracesView({ history }) {
  const [selected, setSelected] = useState(history[0] || null)
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState(false)

  const current = selected || history[0] || null

  const filtered = history.filter(
    (item) =>
      item.traceId.toLowerCase().includes(query.toLowerCase()) ||
      item.scenario.toLowerCase().includes(query.toLowerCase()) ||
      String(item.status).includes(query)
  )

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <p className="text-slate-500 text-sm">
          Aucune trace enregistrée. Lancez d&apos;abord une commande depuis l&apos;onglet{' '}
          <strong className="text-slate-800">Commandes &amp; Tests</strong>.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Liste des traces à gauche */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher TraceID, ST02, 500..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
          {filtered.map((item, idx) => {
            const isSelected = current?.traceId === item.traceId
            return (
              <button
                key={idx}
                onClick={() => setSelected(item)}
                className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between ${
                  isSelected ? 'bg-indigo-50/80' : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        item.success
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{item.scenario}</span>
                    <span className="text-[11px] text-slate-400">{item.timestamp}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    {item.traceId.slice(0, 22)}...
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-700">{item.durationMs} ms</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Détail waterfall + logs corrélés à droite */}
      {current && (
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs text-slate-400 block">Identifiant de trace (W3C)</span>
              <span className="font-mono text-xs sm:text-sm font-medium text-slate-900">
                {current.traceId}
              </span>
            </div>
            <button
              onClick={() => handleCopy(current.traceId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié' : 'Copier TraceID'}
            </button>
          </div>

          {/* Cascade de spans */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Parcours distribué ({current.durationMs} ms)
            </h3>
            <div className="space-y-3">
              {current.spans.map((sp, i) => {
                const total = Math.max(current.durationMs, 1)
                const width = Math.min(100, Math.max(8, Math.round((sp.ms / total) * 100)))
                const left = Math.min(85, Math.round((sp.offset / total) * 100))

                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">
                        {sp.service} <span className="text-slate-400 font-normal">· {sp.step}</span>
                      </span>
                      <span className={`font-mono ${!sp.ok ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                        {sp.ms} ms
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${width}%`, marginLeft: `${left}%` }}
                        className={`h-full rounded-full ${
                          !sp.ok ? 'bg-rose-500' : sp.slow ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Journaux corrélés (ST06) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              Journaux corrélés (ST06)
            </h3>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-2 font-mono text-xs">
              {current.logs.map((log, i) => (
                <div key={i} className="leading-relaxed text-slate-700">
                  <span
                    className={`inline-block w-12 font-semibold ${
                      log.level === 'ERROR'
                        ? 'text-rose-600'
                        : log.level === 'WARN'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-indigo-600 font-medium">[{log.service}]</span>{' '}
                  <span>{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
