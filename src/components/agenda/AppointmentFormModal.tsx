import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { format, addWeeks } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { checkOverlap, LUNCH_START, LUNCH_END } from '@/lib/agenda-utils'

export function AppointmentFormModal({
  open,
  onOpenChange,
  onSuccess,
  holidays,
  appointments,
}: any) {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      type: 'presencial',
      date: format(new Date(), 'yyyy-MM-dd'),
      start: '08:00',
      end: '08:50',
      recurrence: 'none',
      notes: '',
      patient: '',
    },
  })

  useEffect(() => {
    if (open) {
      pb.collection('patients')
        .getFullList({ filter: 'is_active = true', sort: 'name' })
        .then(setPatients)
        .catch(() => {})
      setWarnings([])
      reset()
    }
  }, [open, reset])

  const wType = watch('type')

  const onSubmit = async (data: any) => {
    const isLunch = checkOverlap(data.start, data.end, LUNCH_START, LUNCH_END)
    const isHoliday = holidays.find((h: any) => h.date === data.date)
    const hasOverlap = appointments.some(
      (a: any) =>
        a.scheduled_date.startsWith(data.date) &&
        a.status !== 'cancelado' &&
        checkOverlap(data.start, data.end, a.start_time, a.end_time),
    )

    if (warnings.length === 0 && (isLunch || isHoliday || hasOverlap)) {
      const msgs = []
      if (isLunch) msgs.push('Horário de almoço (12h as 13h).')
      if (isHoliday) msgs.push(`Feriado: ${isHoliday.name}. Trabalha neste feriado?`)
      if (hasOverlap) msgs.push('Conflito de horário! Deseja agendar mesmo assim?')
      setWarnings(msgs)
      return
    }

    setLoading(true)
    try {
      const isBlock = data.type === 'bloqueado'
      const baseData = {
        patient: isBlock ? null : data.patient,
        professional: pb.authStore.record?.id,
        scheduled_date: new Date(data.date + 'T12:00:00Z').toISOString(),
        start_time: data.start,
        end_time: data.end,
        session_type: data.type,
        status: isBlock ? 'realizado' : 'agendado',
        notes: isBlock ? data.notes : '',
      }

      if (data.recurrence === 'semanal') {
        if (!warnings.includes('Gerar 12 sessões')) {
          setWarnings(['Serão geradas 12 sessões semanais a partir desta data. Confirmar?'])
          setLoading(false)
          return
        }
        const ops = Array.from({ length: 12 }).map((_, i) => {
          const d = addWeeks(new Date(data.date + 'T12:00:00Z'), i)
          return pb
            .collection('appointments')
            .create({ ...baseData, scheduled_date: d.toISOString() })
        })
        await Promise.all(ops)
        toast.success('Bloco de 12 sessões agendado!')
      } else {
        await pb.collection('appointments').create(baseData)
        toast.success('Sessão agendada com sucesso!')
      }
      onSuccess()
      onOpenChange(false)
    } catch (e) {
      toast.error('Erro ao agendar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Tipo de Sessão</Label>
              <Select onValueChange={(v) => setValue('type', v)} defaultValue="presencial">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="extra">Extra</SelectItem>
                  <SelectItem value="bloqueado">Bloqueio Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {wType !== 'bloqueado' && (
              <div className="space-y-2 col-span-2">
                <Label>Paciente</Label>
                <Select onValueChange={(v) => setValue('patient', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente ativo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 col-span-2">
              <Label>Data</Label>
              <Input type="date" {...register('date', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label>Início</Label>
              <Input type="time" {...register('start', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label>Término</Label>
              <Input type="time" {...register('end', { required: true })} />
            </div>

            {wType !== 'bloqueado' && (
              <div className="space-y-2 col-span-2">
                <Label>Repetição</Label>
                <Select onValueChange={(v) => setValue('recurrence', v)} defaultValue="none">
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não se repete</SelectItem>
                    <SelectItem value="semanal">Semanal (Bloqueio 3 meses)</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {wType === 'bloqueado' && (
              <div className="space-y-2 col-span-2">
                <Label>Motivo do Bloqueio</Label>
                <Input placeholder="Ex: Almoço, Supervisão, Pessoal..." {...register('notes')} />
              </div>
            )}
          </div>

          {warnings.length > 0 && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-3 my-2 rounded text-orange-800 text-sm">
              <p className="font-bold mb-1">Atenção!</p>
              <ul className="list-disc pl-4">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {warnings.length > 0 ? 'Confirmar e Salvar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
