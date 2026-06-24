import { useEffect, useState } from 'react'
import {
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { WaitlistPanel } from '@/components/agenda/WaitlistPanel'
import { AgendaLegend } from '@/components/agenda/AgendaLegend'
import { CalendarWeekly } from '@/components/agenda/CalendarWeekly'
import { CalendarDaily } from '@/components/agenda/CalendarDaily'
import { CalendarMonthly } from '@/components/agenda/CalendarMonthly'
import { AppointmentFormModal } from '@/components/agenda/AppointmentFormModal'
import { fetchHolidays } from '@/lib/agenda-utils'
import { toast } from 'sonner'

export default function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [appointments, setAppointments] = useState<any[]>([])
  const [holidays, setHolidays] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadData = async () => {
    try {
      const records = await pb
        .collection('appointments')
        .getFullList({ expand: 'patient', sort: '-scheduled_date' })
      setAppointments(records)

      // Auto cancel 24h unconfirmed
      const toCancel = records.filter((a) => {
        if (a.status !== 'agendado') return false
        const d = new Date(`${a.scheduled_date.split(' ')[0]}T${a.start_time}:00`)
        const diff = (d.getTime() - new Date().getTime()) / (1000 * 60 * 60)
        return diff > 0 && diff < 24 && !a.patient_confirmed_at && a.session_type !== 'bloqueado'
      })
      if (toCancel.length > 0) {
        toCancel.forEach(async (a) => {
          await pb
            .collection('appointments')
            .update(a.id, {
              status: 'cancelado',
              notes: a.notes + ' [Cancelamento Automático 24h]',
            })
        })
        toast.info(
          `${toCancel.length} sessões canceladas automaticamente (regra de 24h sem confirmação).`,
        )
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
    fetchHolidays(currentDate.getFullYear()).then(setHolidays)
  }, [currentDate.getFullYear()])

  useRealtime('appointments', () => loadData())

  const navigate = (direction: 'prev' | 'next') => {
    if (view === 'daily')
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1))
    else if (view === 'weekly')
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
    else
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
  }

  const handleSlotClick = (dateStr: string, timeStr: string) => {
    setIsModalOpen(true)
  }

  const handleAppointmentClick = (app: any) => {
    toast.info(`Sessão selecionada: ${app.expand?.patient?.name || 'Bloqueio'}`)
  }

  return (
    <div className="h-full flex flex-col space-y-4 animate-fade-in pb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas sessões e horários.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => toast.info('Sincronização com Google Calendar iniciada (Simulação)')}
          >
            <CalendarIcon className="w-4 h-4" /> Sync Google
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova Sessão
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="w-full lg:w-64 flex flex-col gap-4">
          <div className="bg-card p-4 rounded-md border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Hoje
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => navigate('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="text-center font-bold capitalize text-lg">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </div>
            <Select value={view} onValueChange={(v: any) => setView(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Visualização Diária</SelectItem>
                <SelectItem value="weekly">Visualização Semanal</SelectItem>
                <SelectItem value="monthly">Visualização Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-h-[200px]">
            <WaitlistPanel />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-[500px] overflow-hidden gap-4">
          <AgendaLegend />

          {view === 'daily' && (
            <CalendarDaily
              date={currentDate}
              appointments={appointments}
              onClickSlot={handleSlotClick}
              onClickAppointment={handleAppointmentClick}
            />
          )}
          {view === 'weekly' && (
            <CalendarWeekly
              start={startOfWeek(currentDate)}
              appointments={appointments}
              onClickSlot={handleSlotClick}
              onClickAppointment={handleAppointmentClick}
            />
          )}
          {view === 'monthly' && (
            <CalendarMonthly
              date={currentDate}
              appointments={appointments}
              onClickSlot={handleSlotClick}
              onClickAppointment={handleAppointmentClick}
            />
          )}
        </div>
      </div>

      <AppointmentFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={loadData}
        holidays={holidays}
        appointments={appointments}
      />
    </div>
  )
}
