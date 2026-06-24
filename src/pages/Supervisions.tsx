import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Sparkles, FileText, CheckCircle } from 'lucide-react'

export default function Supervisions() {
  const { user } = useAuth()
  const [asSupervisor, setAsSupervisor] = useState<any[]>([])
  const [asSupervised, setAsSupervised] = useState<any[]>([])
  const [supervisorEmail, setSupervisorEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [agenda, setAgenda] = useState<{ [key: string]: string }>({})

  const loadData = async () => {
    try {
      const res = await pb.collection('supervisions').getFullList({
        expand: 'supervisor,supervised',
        sort: '-created',
      })
      setAsSupervisor(res.filter((s) => s.supervisor === user?.id))
      setAsSupervised(res.filter((s) => s.supervised === user?.id))
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])
  useRealtime('supervisions', loadData)

  const inviteSupervisor = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supervisors = await pb
        .collection('users')
        .getList(1, 1, { filter: `email='${supervisorEmail}'` })
      if (supervisors.items.length === 0) throw new Error('Usuário não encontrado')

      await pb.collection('supervisions').create({
        supervisor: supervisors.items[0].id,
        supervised: user?.id,
        status: 'pendente',
        frequency: 'semanal',
      })
      toast({ title: 'Convite enviado com sucesso' })
      setSupervisorEmail('')
    } catch (err: any) {
      toast({ title: err.message || 'Erro ao enviar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await pb.collection('supervisions').update(id, { status })
      toast({ title: 'Status atualizado' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const generateAgenda = async (id: string) => {
    try {
      setAgenda((prev) => ({ ...prev, [id]: 'Gerando pauta...' }))
      const res = await pb.send(`/backend/v1/supervisions/${id}/agenda`, { method: 'GET' })
      setAgenda((prev) => ({ ...prev, [id]: res.summary }))
    } catch (e) {
      setAgenda((prev) => ({ ...prev, [id]: 'Erro ao gerar pauta.' }))
    }
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supervisão Clínica</h1>
          <p className="text-gray-500 mt-1">
            Gerencie suas sessões de supervisão e horas validadas pelo CFP.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Convidar Supervisor</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={inviteSupervisor}>
              <DialogHeader>
                <DialogTitle>Convidar Supervisor</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-2">
                <Label>Email do Supervisor (cadastrado na Syntra)</Label>
                <Input
                  type="email"
                  value={supervisorEmail}
                  onChange={(e) => setSupervisorEmail(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  Enviar Convite
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="supervisionado" className="w-full">
        <TabsList>
          <TabsTrigger value="supervisionado">
            Meus Supervisores ({asSupervised.length})
          </TabsTrigger>
          <TabsTrigger value="supervisor">Meus Supervisionados ({asSupervisor.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="supervisionado" className="mt-6 space-y-4">
          {asSupervised.map((sup) => (
            <Card key={sup.id}>
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{sup.expand?.supervisor?.name}</h3>
                    <p className="text-sm text-gray-500">Frequência: {sup.frequency}</p>
                  </div>
                  <Badge variant={sup.status === 'ativo' ? 'default' : 'outline'}>
                    {sup.status}
                  </Badge>
                </div>
                {sup.status === 'ativo' && (
                  <div className="mt-4 border-t pt-4">
                    <Button
                      variant="outline"
                      className="flex gap-2"
                      onClick={() => generateAgenda(sup.id)}
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Gerar Pauta da Semana (IA)
                    </Button>
                    {agenda[sup.id] && (
                      <div className="mt-4 p-4 bg-amber-50/50 border border-amber-100 rounded-md text-sm whitespace-pre-wrap">
                        {agenda[sup.id]}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="supervisor" className="mt-6 space-y-4">
          {asSupervisor.map((sup) => (
            <Card key={sup.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{sup.expand?.supervised?.name}</h3>
                    <p className="text-sm text-gray-500">Status: {sup.status}</p>
                  </div>
                  {sup.status === 'pendente' && (
                    <div className="space-x-2">
                      <Button size="sm" onClick={() => updateStatus(sup.id, 'ativo')}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(sup.id, 'encerrado')}
                      >
                        Recusar
                      </Button>
                    </div>
                  )}
                </div>
                {sup.status === 'ativo' && (
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" /> Registrar Horas
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => generateAgenda(sup.id)}>
                      <Sparkles className="w-4 h-4 text-amber-500 mr-2" /> Ver Pauta do
                      Supervisionado
                    </Button>
                  </div>
                )}
                {agenda[sup.id] && (
                  <div className="mt-4 p-4 bg-amber-50/50 border border-amber-100 rounded-md text-sm whitespace-pre-wrap">
                    {agenda[sup.id]}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
