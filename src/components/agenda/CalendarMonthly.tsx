import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
} from 'date-fns'
import { getColorClass } from '@/lib/agenda-utils'

export function CalendarMonthly({ date, appointments, onClickSlot, onClickAppointment }: any) {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  return (
    <div className="flex-1 border rounded-md bg-card flex flex-col">
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
          <div key={i} className="p-2 text-center text-sm font-medium border-r last:border-r-0">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {days.map((d, i) => {
          const dayStr = format(d, 'yyyy-MM-dd')
          const dayApps = appointments.filter((a: any) => a.scheduled_date.startsWith(dayStr))

          return (
            <div
              key={i}
              onClick={() => onClickSlot(dayStr, '08:00')}
              className={`border-b border-r last:border-r-0 p-1 min-h-[100px] cursor-pointer hover:bg-muted/30 transition-colors ${!isSameMonth(d, date) ? 'opacity-40 bg-muted/20' : ''} ${isSameDay(d, new Date()) ? 'bg-primary/5' : ''}`}
            >
              <div
                className={`text-right text-xs p-1 ${isSameDay(d, new Date()) ? 'font-bold text-primary' : ''}`}
              >
                {format(d, 'd')}
              </div>
              <div className="space-y-1 mt-1 overflow-auto max-h-[80px]">
                {dayApps.map((a: any) => (
                  <div
                    key={a.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onClickAppointment(a)
                    }}
                    className={`text-[10px] px-1 py-0.5 rounded truncate ${getColorClass(a.session_type, a.status)}`}
                  >
                    {a.start_time.substring(0, 5)}{' '}
                    {a.session_type === 'bloqueado'
                      ? 'Bloqueio'
                      : a.expand?.patient?.name?.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
