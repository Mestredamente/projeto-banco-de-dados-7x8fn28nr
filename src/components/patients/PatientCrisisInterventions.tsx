import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Plus, AlertTriangle, ShieldAlert, User, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'

type CrisisEvent = {
  id: string
  type: 'manual' | 'ai_alert'
  date: string
  triggerWord: string
  actionTaken: string
  observations: string
  isResolved?: boolean
}

export function PatientCrisisInterventions({ patientId }: { patientId: string }) {
  const { user } = useAuth()
  const [events, setEvents] = useState<CrisisEvent[]>([])
  const [open, setOpen] = useState(false)

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [time, setTime] = useState(format(new Date(), 'HH:mm'))
  const [actionTaken, setActionTaken] = useState('')
  const [observations, setObservations] = useState('')

  const load = async () => {
    try {
      const [notesRes, alertsRes] = await Promise.all([
        pb.collection('session_notes').getFullList({
          filter: `patient = "${patientId}" && evolution_type = "Intervenção em crise"`,
          sort: '-session_date',
        }),
        pb.collection('ai_alerts').getFullList({
          filter: `patient = "${patientId}" && type = "crise"`,
          sort: '-date_generated',
        }),
      ])

      const noteEvents: CrisisEvent[] = notesRes.map((n) => ({
        id: n.id,
        type: 'manual',
        date: n.session_date || n.created,
        triggerWord: 'Registro Manual',
        actionTaken: n.interventions || '-',
        observations: n.content || '-',
      }))

      const alertEvents: CrisisEvent[] = alertsRes.map((a) => ({
        id: a.id,
        type: 'ai_alert',
        date: a.date_generated || a.created,
        triggerWord: a.description,
        actionTaken: a.is_resolved ? 'Alerta resolvido' : 'Pendente de revisão',
        observations: 'Alerta automático gerado pela IA (Crise e Segurança)',
        isResolved: a.is_resolved,
      }))

      const combined = [...noteEvents, ...alertEvents].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )

      setEvents(combined)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [patientId])

  useRealtime('session_notes', () => {
    load()
  })

  useRealtime('ai_alerts', () => {
    load()
  })

  const handleSave = async () => {
    if (!date || !time || !actionTaken || !observations) {
      toast({ title: 'Preencha todos os campos.', variant: 'destructive' })
      return
    }

    try {
      const sessionDate = new Date(`${date}T${time}:00`).toISOString()
      await pb.collection('session_notes').create({
        patient: patientId,
        professional: user.id,
        content: observations,
        interventions: actionTaken,
        evolution_type: 'Intervenção em crise',
        status: 'finalizado',
        session_date: sessionDate,
      })
      toast({ title: 'Intervenção registrada com sucesso' })
      setOpen(false)
      setActionTaken('')
      setObservations('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setTime(format(new Date(), 'HH:mm'))
      load()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center bg-red-50 p-4 rounded-lg border border-red-100 flex-col md:flex-row gap-4">
        <div>
          <h3 className="text-red-900 font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Intervenções em Crise
          </h3>
          <p className="text-sm text-red-700">
            Histórico de ações e alertas acionados para a segurança deste paciente.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" /> Nova Intervenção
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Nenhum registro de crise ou intervenção encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card
              key={event.id}
              className={`border-l-4 ${event.type === 'ai_alert' ? 'border-l-red-500' : 'border-l-blue-500'} shadow-sm`}
            >
              <CardHeader className="pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {event.type === 'ai_alert' ? (
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                  ) : (
                    <User className="w-4 h-4 text-blue-500" />
                  )}
                  <CardTitle className="text-sm font-bold text-gray-700">
                    {format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm")}
                  </CardTitle>
                  <Badge
                    variant={event.type === 'ai_alert' ? 'destructive' : 'secondary'}
                    className="ml-2"
                  >
                    {event.type === 'ai_alert' ? 'Alerta de IA' : 'Registro Manual'}
                  </Badge>
                  {event.type === 'ai_alert' && event.isResolved && (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-200 bg-green-50 ml-2"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Resolvido
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Palavra-gatilho / Origem
                    </span>
                    <p className="text-sm text-gray-900 mt-1">{event.triggerWord}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Ação Tomada
                    </span>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                      {event.actionTaken}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Observações
                    </span>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                      {event.observations}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Intervenção em Crise</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label>Ação Tomada</Label>
            <Textarea
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="Descreva as medidas implementadas (ex: Contato com familiar, encaminhamento ao PS...)"
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2 mt-4">
            <Label>Observações</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Detalhes adicionais da intervenção..."
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
