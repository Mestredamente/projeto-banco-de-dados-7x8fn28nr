import { useEffect, useState, useCallback } from 'react'
import { usePatient } from '@/hooks/use-patient'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Calendar, Clock, Video, MapPin, XCircle, RefreshCw } from 'lucide-react'

export default function PatientAgenda() {
  const { patient, loading } = usePatient()
  const [appointments, setAppointments] = useState<any[]>([])
  const [selectedAppt, setSelectedAppt] = useState<any>(null)

  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const [justificativa, setJustificativa] = useState('')
  const [sugestao, setSugestao] = useState('')

  const loadAppointments = useCallback(async () => {
    if (!patient) return
    try {
      const records = await pb.collection('appointments').getFullList({
        filter: `patient="${patient.id}"`,
        sort: '-scheduled_date,-start_time',
        expand: 'professional',
      })
      setAppointments(records)
    } catch (err) {
      console.error(err)
    }
  }, [patient])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  useRealtime('appointments', () => {
    loadAppointments()
  })

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await pb.collection('notifications').create({
        profile: selectedAppt.professional,
        patient: patient.id,
        title: 'Solicitação de Reagendamento',
        body: `O paciente solicitou reagendamento da sessão de ${format(parseISO(selectedAppt.scheduled_date), 'dd/MM/yyyy')}. Sugestão: ${sugestao}. Justificativa: ${justificativa}`,
        type: 'alerta',
        reference_table: 'appointments',
        reference_id: selectedAppt.id,
      })
      toast({ title: 'Solicitação enviada', description: 'Seu psicólogo avaliará a solicitação.' })
      setRescheduleOpen(false)
      setJustificativa('')
      setSugestao('')
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleCancel = async () => {
    try {
      await pb.collection('appointments').update(selectedAppt.id, { status: 'cancelado' })
      await pb.collection('notifications').create({
        profile: selectedAppt.professional,
        patient: patient.id,
        title: 'Sessão Cancelada pelo Paciente',
        body: `A sessão do dia ${format(parseISO(selectedAppt.scheduled_date), 'dd/MM/yyyy')} foi cancelada pelo paciente.`,
        type: 'alerta',
        reference_table: 'appointments',
        reference_id: selectedAppt.id,
      })
      toast({ title: 'Sessão cancelada com sucesso' })
      setCancelOpen(false)
      loadAppointments()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  if (loading) return <div>Carregando...</div>

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const future = appointments
    .filter((a) => a.scheduled_date >= todayStr && a.status !== 'cancelado')
    .reverse()
  const past = appointments.filter((a) => a.scheduled_date < todayStr || a.status === 'cancelado')

  const renderCard = (appt: any, isFuture: boolean) => (
    <Card key={appt.id} className="mb-4 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-teal-700">
              {format(parseISO(appt.scheduled_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
            </span>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
              {appt.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {appt.start_time} - {appt.end_time}
            </span>
            <span className="flex items-center gap-1 capitalize">
              {appt.session_type === 'online' ? (
                <Video className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {appt.session_type}
            </span>
          </div>
          <p className="text-sm text-gray-500">Com: {appt.expand?.professional?.name}</p>
        </div>
        {isFuture && appt.status !== 'cancelado' && (
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAppt(appt)
                setRescheduleOpen(true)
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Reagendar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => {
                setSelectedAppt(appt)
                setCancelOpen(true)
              }}
            >
              <XCircle className="h-4 w-4 mr-1" /> Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meus Agendamentos</h1>
        <p className="text-gray-500">Acompanhe suas sessões passadas e futuras.</p>
      </div>

      <Tabs defaultValue="future" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="future">Próximas Sessões</TabsTrigger>
          <TabsTrigger value="past">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="future">
          {future.length > 0 ? (
            future.map((a) => renderCard(a, true))
          ) : (
            <div className="text-center py-8 text-gray-500">Nenhuma sessão agendada.</div>
          )}
        </TabsContent>
        <TabsContent value="past">
          {past.length > 0 ? (
            past.map((a) => renderCard(a, false))
          ) : (
            <div className="text-center py-8 text-gray-500">Nenhum histórico encontrado.</div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Reagendamento</DialogTitle>
            <DialogDescription>
              Seu psicólogo será notificado. O reagendamento está sujeito à aprovação.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReschedule} className="space-y-4">
            <div className="space-y-2">
              <Label>Sua sugestão de nova data/hora</Label>
              <Input
                placeholder="Ex: Próxima terça na parte da tarde"
                value={sugestao}
                onChange={(e) => setSugestao(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Justificativa</Label>
              <Textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRescheduleOpen(false)}>
                Voltar
              </Button>
              <Button type="submit" className="bg-teal-600 text-white">
                Enviar Solicitação
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Sessão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta sessão? Dependendo da antecedência, cobranças
              podem ser aplicadas conforme seu contrato.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Sim, quero cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
