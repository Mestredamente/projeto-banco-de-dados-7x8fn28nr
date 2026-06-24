import { parse } from 'date-fns'

export const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 7 // 07:00 to 21:00
  return `${hour.toString().padStart(2, '0')}:00`
})

export const LUNCH_START = '12:00'
export const LUNCH_END = '13:00'

export function checkOverlap(
  newStart: string,
  newEnd: string,
  existingStart: string,
  existingEnd: string,
) {
  const ns = parse(newStart, 'HH:mm', new Date())
  const ne = parse(newEnd, 'HH:mm', new Date())
  const es = parse(existingStart, 'HH:mm', new Date())
  const ee = parse(existingEnd, 'HH:mm', new Date())

  return ns < ee && ne > es
}

export function getColorClass(type: string, status: string) {
  if (status === 'cancelado')
    return 'bg-red-100 border-l-4 border-red-500 text-red-800 line-through opacity-70'
  if (status === 'falta') return 'bg-gray-100 border-l-4 border-gray-400 text-gray-700 opacity-80'
  if (type === 'bloqueado') return 'bg-gray-800 border-l-4 border-gray-900 text-white'
  if (type === 'extra') return 'bg-orange-100 border-l-4 border-orange-500 text-orange-800'
  if (type === 'online') return 'bg-green-100 border-l-4 border-green-500 text-green-800'
  return 'bg-blue-100 border-l-4 border-blue-500 text-blue-800' // presencial default
}

export async function fetchHolidays(year: number) {
  try {
    const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`)
    if (res.ok) {
      return await res.json()
    }
  } catch (e) {
    console.error('Feriados fetch failed', e)
  }
  return []
}

export function formatTime(time: string) {
  return time.substring(0, 5) // "14:00:00" -> "14:00"
}
