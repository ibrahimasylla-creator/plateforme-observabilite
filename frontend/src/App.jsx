import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import OrdersView from './components/OrdersView.jsx'
import TracesView from './components/TracesView.jsx'
import BenchmarkView from './components/BenchmarkView.jsx'
import { executeOrderFlow, fetchOrdersHistory, fetchUsers, createUser } from './services/apiClient.js'

export default function App() {
  const [activeTab, setActiveTab] = useState('orders')
  const [activeStack, setActiveStack] = useState('ELK')

  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchOrdersHistory().then((orders) => {
      if (orders.length > 0) setHistory(orders)
    })
    fetchUsers().then((dbUsers) => {
      if (dbUsers.length > 0) {
        setUsers(dbUsers)
        setSelectedUser(dbUsers[0])
      }
    })
  }, [])

  const handleAddUser = async (newUser) => {
    try {
      const savedUser = await createUser(newUser)
      setUsers((prev) => [...prev, savedUser])
      setSelectedUser(savedUser)
    } catch {
      setUsers((prev) => [...prev, newUser])
      setSelectedUser(newUser)
    }
  }

  const handleSendOrder = async (payload) => {
    if (!selectedUser) return
    setIsLoading(true)
    const result = await executeOrderFlow({
      user: selectedUser,
      ...payload,
    })
    setHistory((prev) => [result, ...prev])
    setIsLoading(false)
  }

  const handleRunBatch = async (count, payload) => {
    if (!selectedUser) return
    setIsLoading(true)
    for (let i = 0; i < count; i++) {
      const result = await executeOrderFlow({
        user: selectedUser,
        ...payload,
        scenarioConfig: {
          ...payload.scenarioConfig,
          id: `ST05 · ${payload.scenarioConfig.id}`,
        },
      })
      setHistory((prev) => [result, ...prev])
    }
    setIsLoading(false)
  }

  const total = history.length
  const errors = history.filter((h) => !h.success).length
  const errorRate = total ? Math.round((errors / total) * 100) : 0
  const avgLatency = total
    ? Math.round(history.reduce((sum, h) => sum + h.durationMs, 0) / total)
    : 0

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeStack={activeStack}
        setActiveStack={setActiveStack}
        traceCount={total}
      />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
            <span className="text-xs text-slate-500">Requêtes totales</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{total}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
            <span className="text-xs text-slate-500">Taux d&apos;erreur</span>
            <div className={`text-2xl font-bold mt-1 ${errorRate > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {errorRate} %
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
            <span className="text-xs text-slate-500">Latence moyenne</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{avgLatency} ms</div>
          </div>
        </div>

        {activeTab === 'orders' && (
          <OrdersView
            users={users}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            onAddUser={handleAddUser}
            onSendOrder={handleSendOrder}
            onRunBatch={handleRunBatch}
            isLoading={isLoading}
            lastOrder={history[0] || null}
            onOpenTraces={() => setActiveTab('traces')}
          />
        )}

        {activeTab === 'traces' && <TracesView history={history} />}

        {activeTab === 'benchmark' && <BenchmarkView />}
      </main>
    </div>
  )
}
