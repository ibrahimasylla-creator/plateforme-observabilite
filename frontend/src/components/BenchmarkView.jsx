import React, { useState } from 'react'
import { Check } from 'lucide-react'

export default function BenchmarkView() {
  const [data, setData] = useState({
    elkStartup: 48,
    osStartup: 42,
    elkRam: 2450,
    osRam: 2100,
    elkDisk: 320,
    osDisk: 295,
    elkSearch: 85,
    osSearch: 78,
  })
  const [saved, setSaved] = useState(false)

  const criteria = [
    { label: 'Temps de démarrage', elk: 'elkStartup', os: 'osStartup', unit: 's' },
    { label: 'Mémoire RAM moyenne', elk: 'elkRam', os: 'osRam', unit: 'Mo' },
    { label: 'Espace disque utilisé', elk: 'elkDisk', os: 'osDisk', unit: 'Mo' },
    { label: 'Temps de recherche (TraceID)', elk: 'elkSearch', os: 'osSearch', unit: 'ms' },
  ]

  const handleSave = () => {
    localStorage.setItem('observability_benchmark', JSON.stringify(data))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Comparatif ELK vs OpenSearch
          </h2>
          <p className="text-sm text-slate-500">
            Relevés expérimentaux dans des conditions identiques (Cahier des charges §9).
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition"
        >
          {saved && <Check className="w-3.5 h-3.5" />}
          {saved ? 'Enregistré' : 'Sauvegarder les relevés'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th className="py-3 font-medium">Indicateur mesuré</th>
              <th className="py-3 font-medium">Architecture A · ELK</th>
              <th className="py-3 font-medium">Architecture B · OpenSearch</th>
              <th className="py-3 font-medium">Comparaison visuelle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {criteria.map((c) => {
              const vElk = Number(data[c.elk]) || 0
              const vOs = Number(data[c.os]) || 0
              const max = Math.max(vElk, vOs, 1)

              return (
                <tr key={c.label}>
                  <td className="py-4 font-medium text-slate-800">{c.label}</td>
                  <td className="py-4">
                    <div className="inline-flex items-center gap-1.5">
                      <input
                        type="number"
                        value={data[c.elk]}
                        onChange={(e) => setData({ ...data, [c.elk]: e.target.value })}
                        className="w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-medium"
                      />
                      <span className="text-xs text-slate-400">{c.unit}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="inline-flex items-center gap-1.5">
                      <input
                        type="number"
                        value={data[c.os]}
                        onChange={(e) => setData({ ...data, [c.os]: e.target.value })}
                        className="w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-medium"
                      />
                      <span className="text-xs text-slate-400">{c.unit}</span>
                    </div>
                  </td>
                  <td className="py-4 w-56">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-8 text-slate-400">ELK</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(vElk / max) * 100}%` }}
                            className="h-full bg-amber-500 rounded-full"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-8 text-slate-400">OS</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(vOs / max) * 100}%` }}
                            className="h-full bg-indigo-600 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
