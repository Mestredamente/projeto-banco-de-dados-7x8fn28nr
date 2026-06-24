import { addDays, format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TIME_SLOTS, getColorClass, formatTime } from '@/lib/agenda-utils'

export function CalendarWeekly({ start, appointments, onClickSlot, onClickAppointment }: any) {
  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i))

  return (
    <div className="flex-1 overflow-auto border rounded-md bg-card">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-8 border-b sticky top-0 bg-muted/50 z-10">
          <div className="p-3 text-center text-sm font-medium border-r">Horário</div>
          {days.map((d, i) => (
            <div
              key={i}
              className={`p-3 text-center border-r ${isSameDay(d, new Date()) ? 'bg-primary/10 text-primary' : ''}`}
            >
              <div className="text-xs uppercase">{format(d, 'EEE', { locale: ptBR })}</div>
              <div className="text-lg font-bold">{format(d, 'dd')}</div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="relative">
          {TIME_SLOTS.map((time, i) => (
            <div key={i} className="grid grid-cols-8 border-b group">
              <div className="p-2 text-center text-xs text-muted-foreground border-r">{time}</div>
              {days.map((d, j) => {
                const dayStr = format(d, 'yyyy-MM-dd')
                const slotApps = appointments.filter(
                  (a: any) =>
                    a.scheduled_date.startsWith(dayStr) &&
                    a.start_time.substring(0, 2) === time.substring(0, 2),
                )

                return (
                  <div
                    key={j}
                    className="p-1 border-r min-h-[60px] relative hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => onClickSlot(dayStr, time)}
                  >
                    {slotApps.map((a: any) => (
                      <div
                        key={a.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onClickAppointment(a)
                        }}
                        className={`absolute left-1 right-1 p-1 rounded text-xs shadow-sm truncate flex flex-col ${getColorClass(a.session_type, a.status)}`}
                        style={{
                          top: `${(parseInt(a.start_time.split(':')[1] || '0') / 60) * 100}%`,
                          minHeight: '40px',
                          zIndex: 5,
                        }}
                      >
                        <span className="font-semibold">
                          {formatTime(a.start_time)} -{' '}
                          {a.session_type === 'bloqueado'
                            ? 'Bloqueio'
                            : a.expand?.patient?.name?.split(' ')[0]}
                        </span>
                        {a.session_type !== 'bloqueado' && <span>{a.status}</span>}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
