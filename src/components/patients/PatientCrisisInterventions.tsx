import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Plus, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

export function PatientCrisisInterventions({ patientId }: { patientId: string }) {
  const { user } = useAuth()
  const [interventions, setInterventions] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')

  const load = async () => {
    try {
      const res = await pb.collection('session_notes').getFullList({
        filter: `patient = "${patientId}" && evolution_type = "Intervenção em crise"`,
        sort: '-created',
      })
      setInterventions(res)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [patientId])

  const handleSave = async () => {
    try {
      await pb.collection('session_notes').create({
        patient: patientId,
        professional: user.id,
        content: content,
        evolution_type: 'Intervenção em crise',
        status: 'finalizado',
        session_date: new Date().toISOString(),
      })
      toast({ title: 'Intervenção registrada com sucesso' })
      setOpen(false)
      setContent('')
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
            <AlertTriangle className="w-5 h-5" /> Protocolos de Crise
          </h3>
          <p className="text-sm text-red-700">
            Histórico de ações e alertas acionados para este paciente.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" /> Nova Intervenção
        </Button>
      </div>

      {interventions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Nenhuma intervenção registrada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {interventions.map((inv) => (
            <Card key={inv.id} className="border-l-4 border-l-red-500 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-500">
                  {format(new Date(inv.created), 'dd/MM/yyyy HH:mm')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm">
                  {inv.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-t-4 border-t-red-600">
          <DialogHeader>
            <DialogTitle>Registrar Intervenção Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ação Tomada / Observações</Label>
              <Textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Descreva o contexto da crise e as ações tomadas pelo profissional..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white">
              Salvar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
