import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { diaryApi } from '../api/endpoints'
import { PeriodFilter } from '../components/ui/PeriodFilter'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { getDateRange, formatDate } from '../utils/date'
import type { DiaryEntry } from '../types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

type Period = 'today' | 'week' | 'month' | '30days' | 'custom'

const URINE_COLORS = { clear: 'blue', normal: 'green', concentrated: 'amber' } as const
const STOOL_COLORS = { normal: 'green', hard: 'amber', soft: 'blue', diarrhea: 'red' } as const
const URINE_LABELS = { clear: 'Chiara', normal: 'Normale', concentrated: 'Concentrata' }
const STOOL_LABELS = { normal: 'Normale', hard: 'Dura', soft: 'Molle', diarrhea: 'Diarrea' }

function groupEntriesByDay(entries: DiaryEntry[]) {
  const groups: Record<string, DiaryEntry[]> = {}
  for (const e of entries) {
    const day = e.created_at.slice(0, 10)
    if (!groups[day]) groups[day] = []
    groups[day].push(e)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

export default function Intestino() {
  const [period, setPeriod] = useState<Period>('week')
  const [dateRange, setDateRange] = useState(getDateRange('week'))

  const handlePeriodChange = (p: Period, from: string, to: string) => {
    setPeriod(p)
    setDateRange({ from, to })
  }

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries-bathroom', dateRange],
    queryFn: () => diaryApi.list({ from: dateRange.from, to: dateRange.to, limit: 500 }).then((r) => r.data),
  })

  const bathroomEntries = entries.filter((e) => e.type === 'bathroom')
  const groups = groupEntriesByDay(bathroomEntries)

  const dailyData = groups.map(([day, dayEntries]) => ({
    date: day.slice(5),
    urine: dayEntries.filter((e) => e.urine_type).length,
    stool: dayEntries.filter((e) => e.stool_type).length,
    total: dayEntries.length,
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">💧 Intestino & Idratazione</h1>
          <p className="text-gray-400 text-sm">Monitoraggio bagni e idratazione</p>
        </div>
        <PeriodFilter value={period} onChange={handlePeriodChange} />
      </div>

      {/* Chart */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">Frequenza bagni settimanale</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }} />
            <ReferenceLine y={6} stroke="#ffb547" strokeDasharray="4 4" label={{ value: 'min 6', fill: '#ffb547', fontSize: 10 }} />
            <ReferenceLine y={8} stroke="#00e5a0" strokeDasharray="4 4" label={{ value: 'ok 8', fill: '#00e5a0', fontSize: 10 }} />
            <Bar dataKey="urine" fill="#4da6ff" radius={[4, 4, 0, 0]} name="Urine" />
            <Bar dataKey="stool" fill="#00e5a0" radius={[4, 4, 0, 0]} name="Feci" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Guida rapida */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-3">💡 Guida rapida</h3>
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
          <div>
            <p className="font-semibold text-white mb-1">Urine</p>
            <p>🔵 Chiara — ottima idratazione</p>
            <p>🟢 Normale — buona idratazione</p>
            <p>🟠 Concentrata — bevi di più</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-1">Feci</p>
            <p>🟢 Normale — tutto ok</p>
            <p>🟠 Dura — più fibra e acqua</p>
            <p>🔵 Molle — attenzione</p>
            <p>🔴 Diarrea — consulta medico</p>
          </div>
        </div>
        <div className="mt-3 p-3 bg-[#00e5a0]/5 border border-[#00e5a0]/20 rounded-lg text-xs text-gray-400">
          <p>🎯 Obiettivo: 6-8 minzioni al giorno per una buona idratazione</p>
        </div>
      </Card>

      {/* Day Cards */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Caricamento...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">💧</p>
          <p>Nessun dato per questo periodo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(([day, dayEntries]) => {
            const urine = dayEntries.filter((e) => e.urine_type)
            const stool = dayEntries.filter((e) => e.stool_type)
            const urineCount = urine.length
            let hydrationStatus = 'OK'
            let hydrationColor = 'green'
            if (urineCount < 6) { hydrationStatus = 'Bevi di più'; hydrationColor = 'amber' }
            else if (urineCount > 10) { hydrationStatus = 'Riduci'; hydrationColor = 'blue' }

            return (
              <Card key={day}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white text-sm">{formatDate(day)}</h3>
                  <Badge variant={hydrationColor as 'green' | 'amber' | 'blue'} size="sm">
                    💧 {hydrationStatus}
                  </Badge>
                </div>

                {urine.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-400 mb-1">Urine ({urine.length}×)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {urine.map((e) => (
                        <Badge key={e.id} variant={URINE_COLORS[e.urine_type!]} size="sm">
                          {URINE_LABELS[e.urine_type!]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {stool.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Feci ({stool.length}×)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {stool.map((e) => (
                        <Badge key={e.id} variant={STOOL_COLORS[e.stool_type!]} size="sm">
                          {STOOL_LABELS[e.stool_type!]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
