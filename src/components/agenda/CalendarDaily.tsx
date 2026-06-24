import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TIME_SLOTS, getColorClass, formatTime } from '@/lib/agenda-utils'

export function CalendarDaily({ date, appointments, onClickSlot, onClickAppointment }: any) {
  const dayStr = format(date, 'yyyy-MM-dd')

  return (
    <div className="flex-1 overflow-auto border rounded-md bg-card">
      <div className="border-b sticky top-0 bg-muted/50 z-10 p-3 text-center">
        <h2 className="text-lg font-bold capitalize">
          {format(date, 'EEEE, dd MMMM yyyy', { locale: ptBR })}
        </h2>
      </div>

      <div className="relative">
        {TIME_SLOTS.map((time, i) => {
          const slotApps = appointments.filter(
            (a: any) =>
              a.scheduled_date.startsWith(dayStr) &&
              a.start_time.substring(0, 2) === time.substring(0, 2),
          )

          return (
            <div
              key={i}
              className="flex border-b group hover:bg-muted/30 cursor-pointer"
              onClick={() => onClickSlot(dayStr, time)}
            >
              <div className="w-20 p-4 text-right text-sm text-muted-foreground border-r">
                {time}
              </div>
              <div className="flex-1 p-2 relative min-h-[80px]">
                {slotApps.map((a: any) => (
                  <div
                    key={a.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onClickAppointment(a)
                    }}
                    className={`absolute left-2 right-2 p-2 rounded shadow-sm flex items-center justify-between ${getColorClass(a.session_type, a.status)}`}
                    style={{
                      top: `${(parseInt(a.start_time.split(':')[1] || '0') / 60) * 100}%`,
                      zIndex: 5,
                    }}
                  >
                    <div>
                      <div className="font-bold text-sm">
                        {formatTime(a.start_time)} - {formatTime(a.end_time)}
                      </div>
                      <div className="text-sm">
                        {a.session_type === 'bloqueado'
                          ? a.notes || 'Bloqueio Manual'
                          : a.expand?.patient?.name}
                      </div>
                    </div>
                    <div className="text-xs uppercase font-semibold">{a.status}</div>
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
