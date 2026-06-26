import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { format, addDays, isBefore } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Edit2, ExternalLink } from 'lucide-react'
import { EmptyState } from '@/components/system/EmptyState'

export function UpcomingSessions() {
  const [sessions, setSessions] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState<any>(null)
  const [linkValue, setLinkValue] = useState('')

  const loadData = async () => {
    try {
      const today = new Date()
      const filter = `session_type = 'online' && scheduled_date >= '${format(today, 'yyyy-MM-dd')} 00:00:00' && status != 'cancelado'`

      const [apptsRes, termsRes] = await Promise.all([
        pb
          .collection('appointments')
          .getFullList({ filter, expand: 'patient', sort: 'scheduled_date' }),
        pb.collection('termos_telepsicologia').getFullList(),
      ])

      setSessions(apptsRes)
      setTerms(termsRes)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveLink = async () => {
    try {
      await pb.collection('appointments').update(editModal.id, { meeting_link: linkValue })
      toast.success('Link atualizado com sucesso!')
      setEditModal(null)
      loadData()
    } catch (e) {
      toast.error('Erro ao salvar link')
    }
  }

  const next7Days = addDays(new Date(), 7)
  const count7Days = sessions.filter((s) => isBefore(new Date(s.scheduled_date), next7Days)).length

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
          🖥️ Você tem {count7Days} {count7Days === 1 ? 'sessão online' : 'sessões online'} nos
          próximos 7 dias
        </h3>
      </Card>

      <div className="border rounded-md overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Paciente</th>
              <th className="px-4 py-3 font-medium">Data / Hora</th>
              <th className="px-4 py-3 font-medium">Status do Link</th>
              <th className="px-4 py-3 font-medium">Termo (CFP)</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sessions.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-12">
                  <EmptyState
                    icon={ExternalLink}
                    title="Nenhuma sessão online agendada"
                    description="Crie uma sessão online na Agenda para começar."
                  />
                </td>
              </tr>
            )}
            {sessions.map((s) => {
              const hasLink = !!s.meeting_link
              const patientTerm = terms.find((t) => t.patient === s.patient)
              const termOk = patientTerm?.status === 'Aceito'

              return (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {s.expand?.patient?.name || 'Desconhecido'}
                  </td>
                  <td className="px-4 py-3">
                    {format(new Date(s.scheduled_date), 'dd/MM/yyyy')} às {s.start_time}
                  </td>
                  <td className="px-4 py-3">
                    {hasLink ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        🟢 Link OK
                      </span>
                    ) : (
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                        title="Adicione um link de videochamada"
                      >
                        🟡 Sem Link
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {termOk ? (
                      <span className="text-green-600 text-xs font-medium">✅ Aceito</span>
                    ) : (
                      <span
                        className="text-red-500 text-xs font-medium"
                        title="Paciente ainda não aceitou o termo de telepsicologia"
                      >
                        ⚠️ Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditModal(s)
                        setLinkValue(s.meeting_link || '')
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-1" /> Editar Link
                    </Button>
                    <Button
                      size="sm"
                      disabled={!hasLink}
                      onClick={() => window.open(s.meeting_link, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" /> Abrir Sala
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editModal} onOpenChange={(o) => !o && setEditModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Link da Sessão</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Link da Videochamada (Google Meet, Zoom, etc)</Label>
              <Input
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLink}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
