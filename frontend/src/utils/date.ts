import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { it } from 'date-fns/locale'

export const formatDate = (date: string | Date, fmt = 'dd/MM/yyyy') =>
  format(new Date(date), fmt, { locale: it })

export const formatDateTime = (date: string | Date) =>
  format(new Date(date), 'dd/MM HH:mm', { locale: it })

export const toISOString = (date: Date) => date.toISOString()

export const getDateRange = (period: string): { from: string; to: string } => {
  const now = new Date()
  switch (period) {
    case 'today':
      return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() }
    case 'week':
      return { from: startOfWeek(now, { weekStartsOn: 1 }).toISOString(), to: endOfWeek(now, { weekStartsOn: 1 }).toISOString() }
    case 'month':
      return { from: startOfMonth(now).toISOString(), to: endOfMonth(now).toISOString() }
    case '30days':
    default:
      return { from: subDays(now, 30).toISOString(), to: now.toISOString() }
  }
}
