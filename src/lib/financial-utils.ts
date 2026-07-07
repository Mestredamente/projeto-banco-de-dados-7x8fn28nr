import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy')
  } catch {
    return '-'
  }
}

export const formatTime = (timeStr: string) => {
  if (!timeStr) return '--:--'
  return timeStr.substring(0, 5)
}

export const monthKey = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.substring(0, 7)
}

export const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    pago: 'bg-green-100 text-green-700',
    pendente: 'bg-yellow-100 text-yellow-700',
    atrasado: 'bg-red-100 text-red-700',
    cancelado: 'bg-gray-100 text-gray-500',
    aguardando_confirmacao: 'bg-blue-100 text-blue-700',
    estornado: 'bg-gray-100 text-gray-500',
  }
  return map[status] || 'bg-gray-100 text-gray-500'
}

export const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pago: 'Pago',
    pendente: 'Pendente',
    atrasado: 'Atrasado',
    cancelado: 'Cancelado',
    aguardando_confirmacao: 'Aguardando Confirmação',
    estornado: 'Estornado',
  }
  return map[status] || status
}

export const calculateDebtBalance = (records: any[]) =>
  records
    .filter((r) => r.status === 'pendente' || r.status === 'atrasado')
    .reduce((sum, r) => sum + (r.total || 0), 0)

export const getNextCharge = (records: any[]) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const pending = records
    .filter((r) => r.status === 'pendente' && r.due_date)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  return pending.find((r) => new Date(r.due_date) >= now) || pending[0] || null
}

export const getLast3Charges = (records: any[]) =>
  [...records]
    .sort((a, b) => new Date(b.due_date || 0).getTime() - new Date(a.due_date || 0).getTime())
    .slice(0, 3)

export const groupByMonth = (records: any[]) => {
  const groups: Record<string, any[]> = {}
  for (const r of records) {
    if (!r.due_date) continue
    try {
      const key = format(parseISO(r.due_date), 'MMMM yyyy', { locale: ptBR }).toUpperCase()
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    } catch {
      /* skip invalid dates */
    }
  }
  return groups
}

export const getCurrentMonthRecords = (records: any[]) => {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return records.filter((r) => {
    if (!r.due_date) return false
    const d = parseISO(r.due_date)
    return d >= first && d <= last
  })
}

export const getNextProjectedCharges = (records: any[], count: number = 3) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return records
    .filter((r) => r.status === 'pendente' && r.due_date && new Date(r.due_date) > now)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, count)
}
