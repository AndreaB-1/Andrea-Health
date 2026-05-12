import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { biometricsApi } from '../api/endpoints'
import { PeriodFilter } from '../components/ui/PeriodFilter'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { CardSkeleton } from '../components/ui/Skeleton'
import { getDateRange, formatDate } from '../utils/date'
import type { BiometricLog } from '../types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, AreaChart
} from 'recharts'
import toast from 'react-hot-toast'

type Period = 'today' | 'week' | 'month' | '30days' | 'custom'

export default function Biometriche() {
  const [period, setPeriod] = useState<Period>('month')
  const [dateRange, setDateRange] = useState(getDateRange('month'))
  const qc = useQueryClient()

  const [form, setForm] = useState({
    weight_kg: '', body_fat_pct: '', muscle_mass_kg: '',
    body_water_pct: '', bone_mass_kg: '', visceral_fat_index: '', notes: ''
  })

  const handlePeriodChange = (p: Period, from: string, to: string) => {
    setPeriod(p)
    setDateRange({ from, to })
  }

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['biometrics', dateRange],
    queryFn: () => biometricsApi.list(dateRange).then((r) => r.data),
  })

  const { data: latest } = useQuery({
    queryKey: ['biometrics-latest'],
    queryFn: () => biometricsApi.latest().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<BiometricLog>) => biometricsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biometrics'] })
      qc.invalidateQueries({ queryKey: ['biometrics-latest'] })
      setForm({ weight_kg: '', body_fat_pct: '', muscle_mass_kg: '', body_water_pct: '', bone_mass_kg: '', visceral_fat_index: '', notes: '' })
      toast.success('Misurazione salvata!')
    },
    onError: () => toast.error('Errore nel salvataggio'),
  })

  const handleSubmit = () => {
    if (!form.weight_kg) return toast.error('Il peso è obbligatorio')
    const data: Record<string, number | string> = { weight_kg: parseFloat(form.weight_kg) }
    if (form.body_fat_pct) data.body_fat_pct = parseFloat(form.body_fat_pct)
    if (form.muscle_mass_kg) data.muscle_mass_kg = parseFloat(form.muscle_mass_kg)
    if (form.body_water_pct) data.body_water_pct = parseFloat(form.body_water_pct)
    if (form.bone_mass_kg) data.bone_mass_kg = parseFloat(form.bone_mass_kg)
    if (form.visceral_fat_index) data.visceral_fat_index = parseFloat(form.visceral_fat_index)
    if (form.notes) data.notes = form.notes
    createMutation.mutate(data as Partial<BiometricLog>)
  }

  const chartData = [...logs].reverse().map((l) => ({
    date: l.measured_at.slice(0, 10).slice(5),
    weight: l.weight_kg,
    fat: l.body_fat_pct,
    muscle: l.muscle_mass_kg,
    bmi: l.bmi,
  }))

  const prevLog = logs.length > 1 ? logs[1] : null

  const bmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Sottopeso', color: '#4da6ff' }
    if (bmi < 25) return { label: 'Normale', color: '#00e5a0' }
    if (bmi < 30) return { label: 'Sovrappeso', color: '#ffb547' }
    return { label: 'Obeso', color: '#ff6b6b' }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">⚖️ Biometriche</h1>
          <p className="text-gray-400 text-sm">Misurazioni corporee</p>
        </div>
        <PeriodFilter value={period} onChange={handlePeriodChange} />
      </div>

      {/* Form */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">+ Nuova misurazione</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {[
            { key: 'weight_kg', label: 'Peso (kg) *', placeholder: '75.0' },
            { key: 'body_fat_pct', label: 'Grasso (%)', placeholder: '20.0' },
            { key: 'muscle_mass_kg', label: 'Muscolo (kg)', placeholder: '60.0' },
            { key: 'body_water_pct', label: 'Acqua (%)', placeholder: '55.0' },
            { key: 'bone_mass_kg', label: 'Ossa (kg)', placeholder: '3.2' },
            { key: 'visceral_fat_index', label: 'Grasso viscerale', placeholder: '8' },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
              <input
                type="number"
                step="0.1"
                value={form[f.key as keyof typeof form]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00e5a0] font-mono"
              />
            </div>
          ))}
        </div>
        <input
          type="text"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Note (es: mattina a digiuno)"
          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00e5a0] mb-3"
        />
        <Button onClick={handleSubmit} loading={createMutation.isPending} size="sm">
          Salva misurazione
        </Button>
      </Card>

      {/* Latest + comparison */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Peso', value: `${latest.weight_kg} kg`, prev: prevLog?.weight_kg, unit: 'kg' },
            { label: 'BMI', value: latest.bmi ? `${latest.bmi}` : '-', prev: prevLog?.bmi, unit: '' },
            { label: 'Grasso', value: latest.body_fat_pct ? `${latest.body_fat_pct}%` : '-', prev: prevLog?.body_fat_pct, unit: '%' },
            { label: 'Muscolo', value: latest.muscle_mass_kg ? `${latest.muscle_mass_kg} kg` : '-', prev: prevLog?.muscle_mass_kg, unit: 'kg' },
          ].map((k) => {
            const diff = k.prev !== undefined && k.prev !== null
              ? (typeof k.prev === 'number' && typeof latest[k.label.toLowerCase() as keyof BiometricLog] === 'number'
                  ? null : null)
              : null
            return (
              <Card key={k.label}>
                <p className="text-xs text-gray-400">{k.label}</p>
                <p className="text-xl font-bold font-mono text-white mt-1">{k.value}</p>
                {k.label === 'BMI' && latest.bmi && (
                  <p className="text-xs mt-1" style={{ color: bmiCategory(latest.bmi).color }}>
                    {bmiCategory(latest.bmi).label}
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Weight trend */}
      {chartData.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-white mb-4">Trend peso</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e5a0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00e5a0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }} />
              <Area type="monotone" dataKey="weight" stroke="#00e5a0" strokeWidth={2} fill="url(#weightGrad)" name="Peso (kg)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* BMI chart with zones */}
      {chartData.some((d) => d.bmi) && (
        <Card>
          <h3 className="text-sm font-semibold text-white mb-4">Trend BMI</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} domain={[15, 35]} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }} />
              <ReferenceLine y={18.5} stroke="#4da6ff" strokeDasharray="4 4" label={{ value: 'Sottopeso', fill: '#4da6ff', fontSize: 10 }} />
              <ReferenceLine y={25} stroke="#00e5a0" strokeDasharray="4 4" label={{ value: 'Normale', fill: '#00e5a0', fontSize: 10 }} />
              <ReferenceLine y={30} stroke="#ffb547" strokeDasharray="4 4" label={{ value: 'Sovrap.', fill: '#ffb547', fontSize: 10 }} />
              <Line type="monotone" dataKey="bmi" stroke="#ffffff" strokeWidth={2} dot={{ fill: '#ffffff', r: 3 }} name="BMI" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
