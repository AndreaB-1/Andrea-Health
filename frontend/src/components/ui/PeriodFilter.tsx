import { useState } from 'react'
import { getDateRange } from '../../utils/date'

type Period = 'today' | 'week' | 'month' | '30days' | 'custom'

interface PeriodFilterProps {
  value: Period
  onChange: (period: Period, from: string, to: string) => void
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Oggi' },
  { value: 'week', label: 'Settimana' },
  { value: 'month', label: 'Mese' },
  { value: '30days', label: '30 giorni' },
  { value: 'custom', label: 'Custom' },
]

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const handleSelect = (p: Period) => {
    if (p !== 'custom') {
      const range = getDateRange(p)
      onChange(p, range.from, range.to)
    }
  }

  const applyCustom = () => {
    if (customFrom && customTo) {
      onChange('custom', new Date(customFrom).toISOString(), new Date(customTo).toISOString())
    }
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => handleSelect(p.value)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors
            ${value === p.value
              ? 'bg-[#00e5a0] text-black font-semibold'
              : 'bg-[#2a2d3a] text-gray-400 hover:text-white'}`}
        >
          {p.label}
        </button>
      ))}
      {value === 'custom' && (
        <div className="flex gap-2 items-center">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            className="bg-[#2a2d3a] border border-[#3a3d4a] rounded-lg px-2 py-1.5 text-sm text-white" />
          <span className="text-gray-400">—</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            className="bg-[#2a2d3a] border border-[#3a3d4a] rounded-lg px-2 py-1.5 text-sm text-white" />
          <button onClick={applyCustom} className="px-3 py-1.5 bg-[#00e5a0] text-black rounded-lg text-sm font-semibold">
            Applica
          </button>
        </div>
      )}
    </div>
  )
}
