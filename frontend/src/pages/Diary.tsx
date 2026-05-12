import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { diaryApi } from '../api/endpoints'
import type { DiaryEntry } from '../types'
import { formatDate, formatDateTime } from '../utils/date'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { CardSkeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { format, startOfDay, endOfDay } from 'date-fns'

function groupByDay(entries: DiaryEntry[]) {
  const groups: Record<string, DiaryEntry[]> = {}
  for (const entry of entries) {
    const day = entry.created_at.slice(0, 10)
    if (!groups[day]) groups[day] = []
    groups[day].push(entry)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

export default function Diary() {
  const [inputText, setInputText] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const qc = useQueryClient()

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries'],
    queryFn: () => diaryApi.list({ limit: 200 }).then((r) => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (text: string) => diaryApi.analyzeAndSave(text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] })
      setInputText('')
      toast.success('Voce aggiunta!')
    },
    onError: () => toast.error('Errore durante il salvataggio'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => diaryApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] })
      setConfirmDelete(null)
      toast.success('Voce eliminata')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, parsed_text }: { id: number; parsed_text: string }) =>
      diaryApi.update(id, { parsed_text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] })
      setEditingId(null)
      toast.success('Aggiornato')
    },
  })

  const handleSubmit = () => {
    if (!inputText.trim()) return
    addMutation.mutate(inputText.trim())
  }

  const groups = groupByDay(entries)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">📔 Diario</h1>
        <p className="text-gray-400 text-sm">Cosa hai mangiato o fatto?</p>
      </div>

      {/* Input */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit() }}
          placeholder="Es: Ho mangiato pasta al pomodoro con parmigiano... oppure: Bagno, urine chiare"
          rows={3}
          className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm"
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#2a2d3a]">
          <span className="text-xs text-gray-500">Ctrl+Enter per inviare • Analisi AI automatica</span>
          <Button
            onClick={handleSubmit}
            loading={addMutation.isPending}
            disabled={!inputText.trim()}
            size="sm"
          >
            ✨ Aggiungi
          </Button>
        </div>
      </div>

      {/* Entries */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📝</p>
          <p>Nessuna voce ancora. Inizia a registrare!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, dayEntries]) => {
            const meals = dayEntries.filter((e) => e.type === 'meal')
            const bathroom = dayEntries.filter((e) => e.type === 'bathroom')
            const totalKcal = meals.reduce((s, e) => s + (e.calories || 0), 0)

            return (
              <div key={day}>
                {/* Day header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-[#2a2d3a]" />
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-medium text-white">{formatDate(day)}</span>
                    {meals.length > 0 && <span>🍽 {meals.length} pasti</span>}
                    {bathroom.length > 0 && <span>💧 {bathroom.length} bagni</span>}
                    {totalKcal > 0 && <span className="text-[#00e5a0] font-mono">~{Math.round(totalKcal)} kcal</span>}
                  </div>
                  <div className="h-px flex-1 bg-[#2a2d3a]" />
                </div>

                {/* Entries */}
                <div className="space-y-2">
                  {dayEntries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      isEditing={editingId === entry.id}
                      editText={editText}
                      onEditStart={() => { setEditingId(entry.id); setEditText(entry.parsed_text || entry.raw_text) }}
                      onEditChange={setEditText}
                      onEditSave={() => updateMutation.mutate({ id: entry.id, parsed_text: editText })}
                      onEditCancel={() => setEditingId(null)}
                      onDeleteRequest={() => setConfirmDelete(entry.id)}
                      confirmingDelete={confirmDelete === entry.id}
                      onDeleteConfirm={() => deleteMutation.mutate(entry.id)}
                      onDeleteCancel={() => setConfirmDelete(null)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface EntryCardProps {
  entry: DiaryEntry
  isEditing: boolean
  editText: string
  onEditStart: () => void
  onEditChange: (v: string) => void
  onEditSave: () => void
  onEditCancel: () => void
  onDeleteRequest: () => void
  confirmingDelete: boolean
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}

function EntryCard({
  entry, isEditing, editText, onEditStart, onEditChange,
  onEditSave, onEditCancel, onDeleteRequest, confirmingDelete, onDeleteConfirm, onDeleteCancel
}: EntryCardProps) {
  const typeIcon = entry.type === 'meal' ? '🍽' : entry.type === 'bathroom' ? '💧' : '📝'
  const typeColor = entry.type === 'meal' ? 'green' : entry.type === 'bathroom' ? 'blue' : 'gray'

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-3 hover:border-[#3a3d4a] transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{typeIcon}</span>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => onEditChange(e.target.value)}
                rows={2}
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg p-2 text-sm text-white resize-none outline-none focus:border-[#00e5a0]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={onEditSave}>Salva</Button>
                <Button size="sm" variant="ghost" onClick={onEditCancel}>Annulla</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-white">{entry.parsed_text || entry.raw_text}</p>
              {entry.parsed_text && entry.parsed_text !== entry.raw_text && (
                <p className="text-xs text-gray-500 mt-0.5 italic">orig: {entry.raw_text}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {entry.ai_analyzed && <Badge variant="blue" size="sm">✨ AI</Badge>}
                {entry.meal_name && <Badge variant="green" size="sm">{entry.meal_name}</Badge>}
                {entry.calories && (
                  <Badge variant="amber" size="sm">
                    <span className="font-mono">~{Math.round(entry.calories)} kcal</span>
                  </Badge>
                )}
                {(entry.carbs || entry.protein || entry.fat) && (
                  <Badge variant="gray" size="sm">
                    <span className="font-mono">
                      C:{entry.carbs?.toFixed(0)}g P:{entry.protein?.toFixed(0)}g G:{entry.fat?.toFixed(0)}g
                    </span>
                  </Badge>
                )}
                {entry.urine_type && (
                  <Badge variant={entry.urine_type === 'clear' ? 'blue' : entry.urine_type === 'concentrated' ? 'amber' : 'green'} size="sm">
                    Urine: {entry.urine_type === 'clear' ? 'Chiara' : entry.urine_type === 'normal' ? 'Normale' : 'Concentrata'}
                  </Badge>
                )}
                {entry.stool_type && (
                  <Badge variant={entry.stool_type === 'diarrhea' ? 'red' : 'gray'} size="sm">
                    Feci: {entry.stool_type === 'normal' ? 'Normale' : entry.stool_type === 'hard' ? 'Dura' : entry.stool_type === 'soft' ? 'Molle' : 'Diarrea'}
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <span className="text-xs text-gray-600 font-mono">
            {formatDateTime(entry.created_at).split(' ')[1]}
          </span>
          {!isEditing && !confirmingDelete && (
            <>
              <button onClick={onEditStart} className="p-1 text-gray-500 hover:text-white transition-colors rounded">✏️</button>
              <button onClick={onDeleteRequest} className="p-1 text-gray-500 hover:text-red-400 transition-colors rounded">🗑</button>
            </>
          )}
          {confirmingDelete && (
            <div className="flex gap-1">
              <Button size="sm" variant="danger" onClick={onDeleteConfirm}>Elimina</Button>
              <Button size="sm" variant="ghost" onClick={onDeleteCancel}>No</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
