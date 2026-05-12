import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { statsApi } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import { PeriodFilter } from '../components/ui/PeriodFilter'
import { Card } from '../components/ui/Card'
import { CardSkeleton } from '../components/ui/Skeleton'
import { getDateRange } from '../utils/date'
import type { DailyStat } from '../types'

type Period = 'today' | 'week' | 'month' | '30days' | 'custom'

export default function Stats() {
  const { user } = useAuthStore()
  const calorieGoal = (user?.settings as Record<string, number>)?.calorie_goal ?? 1700
  const [period, setPeriod] = useState<Period>('30days')
  const [dateRange, setDateRange] = useState(getDateRange('30days'))

  const handlePeriodChange = (p: Period, from: string, to: string) => {
    setPeriod(p)
    setDateRange({ from, to })
  }

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['stats', dateRange],
    queryFn: () => statsApi.overview(dateRange).then((r) => r.data),
  })

  const { data: daily = [], isLoading: loadingDaily } = useQuery({
    queryKey: ['stats-daily', dateRange],
    queryFn: () => statsApi.daily(dateRange).then((r) => r.data),
  })

  const kpiCards = overview
    ? [
        { label: 'Media kcal/giorno', value: `${Math.round(overview.avg_calories)} kcal`, icon: '🔥', color: 'text-amber-400' },
        { label: 'Media bagni/giorno', value: overview.avg_bathroom.toFixed(1), icon: '💧', color: 'text-blue-400' },
        { label: 'Giorni tracciati', value: `${overview.tracked_days}/${overview.total_days}`, icon: '📅', color: 'text-[#00e5a0]' },
        { label: 'Streak giorni', value: `${overview.streak} 🔥`, icon: '⚡', color: 'text-amber-400' },
      ]
    : []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">📊 Statistiche</h1>
          <p className="text-gray-400 text-sm">Analisi del tuo benessere</p>
        </div>
        <PeriodFilter value={period} onChange={handlePeriodChange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loadingOverview
          ? [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
          : kpiCards.map((k) => (
              <Card key={k.label}>
                <p className="text-xs text-gray-400">{k.icon} {k.label}</p>
                <p className={`text-2xl font-bold font-mono mt-1 ${k.color}`}>{k.value}</p>
              </Card>
            ))}
      </div>

      {/* Calorie Chart */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">Calorie giornaliere</h3>
        {loadingDaily ? (
          <div className="h-48 animate-pulse bg-gray-700/20 rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
              <ReferenceLine y={calorieGoal} stroke="#00e5a0" strokeDasharray="4 4" label={{ value: `Obiettivo: ${calorieGoal}`, fill: '#00e5a0', fontSize: 11 }} />
              <Line type="monotone" dataKey="calories" stroke="#ffb547" strokeWidth={2} dot={{ fill: '#ffb547', r: 3 }} name="kcal" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Macros chart */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">Macronutrienti medi</h3>
        {loadingOverview ? (
          <div className="h-48 animate-pulse bg-gray-700/20 rounded" />
        ) : overview ? (
          <div className="flex gap-6 items-end">
            {[
              { label: 'Carboidrati', value: overview.avg_carbs, color: '#4da6ff', unit: 'g' },
              { label: 'Proteine', value: overview.avg_protein, color: '#00e5a0', unit: 'g' },
              { label: 'Grassi', value: overview.avg_fat, color: '#ffb547', unit: 'g' },
            ].map((m) => {
              const total = overview.avg_carbs + overview.avg_protein + overview.avg_fat
              const pct = total > 0 ? Math.round((m.value / total) * 100) : 0
              return (
                <div key={m.label} className="flex-1 text-center">
                  <div className="h-32 flex items-end justify-center mb-2">
                    <div
                      style={{ height: `${total > 0 ? (m.value / total) * 100 : 0}%`, backgroundColor: m.color, minHeight: 8 }}
                      className="w-12 rounded-t-lg transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-400">{m.label}</p>
                  <p className="font-mono font-bold" style={{ color: m.color }}>{m.value.toFixed(0)}{m.unit}</p>
                  <p className="text-xs text-gray-500">{pct}%</p>
                </div>
              )
            })}
          </div>
        ) : null}
      </Card>

      {/* Bathroom chart */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">Bagni giornalieri</h3>
        {loadingDaily ? (
          <div className="h-48 animate-pulse bg-gray-700/20 rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }} />
              <ReferenceLine y={6} stroke="#ffb547" strokeDasharray="4 4" />
              <ReferenceLine y={8} stroke="#00e5a0" strokeDasharray="4 4" />
              <Bar dataKey="bathroom" fill="#4da6ff" radius={[4, 4, 0, 0]} name="Bagni" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Summary Table */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-3">Riepilogo giornaliero</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-[#2a2d3a]">
                <th className="text-left pb-2">Data</th>
                <th className="text-right pb-2">Kcal</th>
                <th className="text-right pb-2">C</th>
                <th className="text-right pb-2">P</th>
                <th className="text-right pb-2">G</th>
                <th className="text-right pb-2">Bagni</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((d: DailyStat) => (
                <tr key={d.date} className="border-b border-[#2a2d3a]/50 hover:bg-white/2">
                  <td className="py-1.5 text-gray-300">{d.date.slice(5)}</td>
                  <td className="text-right font-mono text-amber-400">{d.calories ? Math.round(d.calories) : '-'}</td>
                  <td className="text-right font-mono text-blue-400">{d.carbs ? d.carbs.toFixed(0) : '-'}</td>
                  <td className="text-right font-mono text-[#00e5a0]">{d.protein ? d.protein.toFixed(0) : '-'}</td>
                  <td className="text-right font-mono text-amber-400">{d.fat ? d.fat.toFixed(0) : '-'}</td>
                  <td className="text-right font-mono text-blue-400">{d.bathroom || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
