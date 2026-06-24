import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Clock, CheckCircle2, AlertTriangle, Fingerprint, Calendar as CalIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SecretaryDashboard() {
  const [assignment, setAssignment] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [vacations, setVacations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [vacStart, setVacStart] = useState('')
  const [vacEnd, setVacEnd] = useState('')

  const loadData = async () => {
    try {
      const authId = pb.authStore.record?.id
      if (!authId) return

      const asg = await pb
        .collection('secretary_assignments')
        .getFirstListItem(`secretary = "${authId}" && is_active = true`, { expand: 'employer' })
        .catch(() => null)
      setAssignment(asg)

      if (asg) {
        const today = new Date().toISOString().split('T')[0]
        const data = await pb.collection('time_entries').getFullList({
          filter: `secretary = "${authId}" && employer = "${asg.employer}" && created >= "${today} 00:00:00"`,
          sort: 'created',
        })
        setEntries(data)

        const vacs = await pb.collection('vacation_requests').getFullList({
          filter: `requester = "${authId}"`,
          sort: '-created',
        })
        setVacations(vacs)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleRegisterTime = async (type: string) => {
    if (!assignment) return
    try {
      await pb.collection('time_entries').create({
        secretary: pb.authStore.record?.id,
        employer: assignment.employer,
        entry_type: type,
      })
      toast.success('Ponto registrado com sucesso!')
      loadData()
    } catch (e: any) {
      toast.error('Erro ao registrar ponto')
    }
  }

  const handleRequestVacation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vacStart || !vacEnd) return toast.error('Preencha as datas')
    try {
      await pb.collection('vacation_requests').create({
        requester: pb.authStore.record?.id,
        approver: assignment.employer,
        start_date: vacStart,
        end_date: vacEnd,
        status: 'pendente',
        reason: 'Férias anuais',
      })
      toast.success('Férias solicitadas com sucesso!')
      setVacStart('')
      setVacEnd('')
      loadData()
    } catch (e) {
      toast.error('Erro ao solicitar férias')
    }
  }

  const hasEntrada = entries.some((e) => e.entry_type === 'entrada')
  const hasInicioInt = entries.some((e) => e.entry_type === 'intervalo_inicio')
  const hasFimInt = entries.some((e) => e.entry_type === 'intervalo_fim')
  const hasSaida = entries.some((e) => e.entry_type === 'saida')

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Olá, {pb.authStore.record?.name}</h1>
          <p className="text-muted-foreground">Painel da Secretária</p>
        </div>
      </div>

      {!assignment && !loading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-800">
              <AlertTriangle className="h-6 w-6" />
              <p>Você não possui nenhum vínculo ativo com um empregador.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {assignment && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-teal-600" />
                Ponto Eletrônico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Horário de Brasília</p>
                <p className="text-4xl font-mono tracking-wider">{format(new Date(), 'HH:mm')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={hasEntrada ? 'outline' : 'default'}
                  className={!hasEntrada ? 'bg-teal-600 hover:bg-teal-700' : ''}
                  disabled={hasEntrada}
                  onClick={() => handleRegisterTime('entrada')}
                >
                  Entrada
                </Button>
                <Button
                  variant={hasInicioInt ? 'outline' : 'secondary'}
                  disabled={!hasEntrada || hasInicioInt}
                  onClick={() => handleRegisterTime('intervalo_inicio')}
                >
                  Início Intervalo
                </Button>
                <Button
                  variant={hasFimInt ? 'outline' : 'secondary'}
                  disabled={!hasInicioInt || hasFimInt}
                  onClick={() => handleRegisterTime('intervalo_fim')}
                >
                  Fim Intervalo
                </Button>
                <Button
                  variant={hasSaida ? 'outline' : 'destructive'}
                  disabled={!hasEntrada || hasSaida}
                  onClick={() => handleRegisterTime('saida')}
                >
                  Saída
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Registros de Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum registro hoje.</p>
                ) : (
                  <div className="space-y-4">
                    {entries.map((e) => (
                      <div
                        key={e.id}
                        className="flex justify-between items-center border-b pb-2 last:border-0"
                      >
                        <span className="capitalize font-medium text-sm">
                          {e.entry_type.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="font-mono">{format(new Date(e.created), 'HH:mm')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalIcon className="h-5 w-5 text-orange-500" />
                  Solicitar Férias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRequestVacation} className="space-y-4 mb-4 border-b pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Início</Label>
                      <Input
                        type="date"
                        value={vacStart}
                        onChange={(e) => setVacStart(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fim</Label>
                      <Input
                        type="date"
                        value={vacEnd}
                        onChange={(e) => setVacEnd(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="secondary" className="w-full">
                    Enviar Solicitação
                  </Button>
                </form>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Suas Solicitações</p>
                  {vacations.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma solicitação.</p>
                  )}
                  {vacations.map((v) => (
                    <div
                      key={v.id}
                      className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded"
                    >
                      <span>
                        {format(new Date(v.start_date), 'dd/MM')} a{' '}
                        {format(new Date(v.end_date), 'dd/MM')}
                      </span>
                      <span
                        className={`uppercase text-xs font-bold ${v.status === 'aprovada' ? 'text-green-600' : v.status === 'negada' ? 'text-red-600' : 'text-orange-500'}`}
                      >
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
