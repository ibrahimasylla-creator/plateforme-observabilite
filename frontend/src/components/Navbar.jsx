import React, { useState } from 'react'
import { Activity, ChevronDown, ExternalLink } from 'lucide-react'

export default function Navbar({
  activeTab,
  setActiveTab,
  activeStack,
  setActiveStack,
  simulationMode,
  setSimulationMode,
  traceCount,
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const externalTools = [
    { name: 'Kibana (Logs ELK)', url: import.meta.env.VITE_KIBANA_URL || 'http://localhost:5601' },
    { name: 'OpenSearch Dashboards', url: import.meta.env.VITE_OPENSEARCH_DASHBOARDS_URL || 'http://localhost:5602' },
    { name: 'Grafana (Métriques)', url: import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3000' },
    { name: 'Prometheus', url: import.meta.env.VITE_PROMETHEUS_URL || 'http://localhost:9090' },
    { name: 'Jaeger / Tempo (Traces)', url: import.meta.env.VITE_JAEGER_URL || 'http://localhost:16686' },
  ]

  const tabs = [
    { id: 'orders', label: 'Commandes & Tests' },
    { id: 'traces', label: `Traces & Logs (${traceCount})` },
    { id: 'benchmark', label: 'Comparatif ELK / OpenSearch' },
  ]

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo & Titre simple */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight block leading-none">
                ObservaLab
              </span>
              <span className="text-[11px] text-slate-500">
                Supervision &amp; Tracing Distribué
              </span>
            </div>
          </div>

          {/* Contrôles essentiels à droite */}
          <div className="flex items-center gap-2.5">
            {/* Sélecteur ELK vs OpenSearch */}
            <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium">
              <button
                onClick={() => setActiveStack('ELK')}
                className={`px-3 py-1 rounded-md transition ${
                  activeStack === 'ELK'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ELK
              </button>
              <button
                onClick={() => setActiveStack('OPENSEARCH')}
                className={`px-3 py-1 rounded-md transition ${
                  activeStack === 'OPENSEARCH'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                OpenSearch
              </button>
            </div>

            {/* Mode Simulation / Réel */}
            <button
              onClick={() => setSimulationMode(!simulationMode)}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                simulationMode
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
              title="Basculer entre le simulateur local et l'API Gateway réelle"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  simulationMode ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
              />
              {simulationMode ? 'Simulation' : 'Backend Réel'}
            </button>

            {/* Menu déroulant Outils externes */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
              >
                Outils
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20">
                    <div className="px-3 py-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Interfaces Externes
                    </div>
                    {externalTools.map((tool) => (
                      <a
                        key={tool.name}
                        href={tool.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition"
                      >
                        <span>{tool.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation par onglets épurée */}
        <nav className="flex gap-6 -mb-px">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-sm font-medium border-b-2 transition ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
