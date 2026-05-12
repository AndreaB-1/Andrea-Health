export type EntryType = 'meal' | 'bathroom' | 'note'
export type UrineType = 'clear' | 'normal' | 'concentrated'
export type StoolType = 'normal' | 'hard' | 'soft' | 'diarrhea'

export interface DiaryEntry {
  id: number
  user_id: number
  type: EntryType
  raw_text: string
  parsed_text: string | null
  meal_name: string | null
  calories: number | null
  carbs: number | null
  protein: number | null
  fat: number | null
  urine_type: UrineType | null
  stool_type: StoolType | null
  ai_analyzed: boolean
  confidence: number | null
  created_at: string
  updated_at: string
}

export interface Tag {
  label: string
  type: string
}

export interface Macros {
  calories: number
  carbs: number
  protein: number
  fat: number
}

export interface AnalyzeResult {
  type: EntryType
  parsed: string
  meal_name: string | null
  tags: Tag[]
  macros: Macros | null
  urine_type: UrineType | null
  stool_type: StoolType | null
  confidence: number
}

export interface BiometricLog {
  id: number
  user_id: number
  weight_kg: number
  body_fat_pct: number | null
  muscle_mass_kg: number | null
  body_water_pct: number | null
  bone_mass_kg: number | null
  visceral_fat_index: number | null
  bmi: number | null
  notes: string | null
  measured_at: string
  created_at: string
}

export interface StatsOverview {
  avg_calories: number
  avg_carbs: number
  avg_protein: number
  avg_fat: number
  avg_bathroom: number
  tracked_days: number
  total_days: number
  streak: number
  total_entries: number
}

export interface DailyStat {
  date: string
  calories: number
  carbs: number
  protein: number
  fat: number
  meals: number
  bathroom: number
}

export interface UserSettings {
  theme: string
  calorie_goal: number
  protein_goal: number
  height_cm: number | null
  telegram_chat_id: string | null
  telegram_bot_token: string | null
  has_claude_api_key: boolean
  reminder_times: ReminderTime[]
  telegram_reminders_enabled: boolean
}

export interface ReminderTime {
  label: string
  time: string
  enabled: boolean
}

export interface User {
  id: number
  username: string
  created_at: string
  settings: Record<string, unknown>
}
