import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Clock, UserPlus, FileText, CheckCircle2, DollarSign } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useRealtime } from '@/hooks/use-realtime'

export default function SecretaryDashboard() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [pendingBills, setPendingBills] = useState<any[]>([])
  const [stats, setStats] = useState({ today: 0, waiting: 0 })
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [todayEntries, setTodayEntries] = useState<any[]>([])

  const loadData = useCallback(async () => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')

      const apps = await pb.collection('appointments').getFullList({
        filter: `scheduled_date >= "${todayStr} 00:00:00" && scheduled_date <= "${todayStr} 23:59:59" && deleted_at = ""`,
        expand: 'patient,professional',
        sort: 'scheduled_date',
      })

      setAppointments(apps)

      const waiting = apps.filter(
        (a) =>
          a.status === 'agendado' &&
          new Date(a.scheduled_date).getTime() < new Date().getTime() + 3600000,
      ).length

      setStats({
        today: apps.length,
        waiting: waiting,
      })

      const entries = await pb.collection('time_entries').getFullList({
        filter: `secretary = "${user?.id}" && entry_time >= "${todayStr} 00:00:00"`,
        sort: '-entry_time',
      })
      setTodayEntries(entries)

      const bills = await pb.collection('financial_records').getList(1, 5, {
        filter: `status = "pendente" && deleted_at = ""`,
        expand: 'patient',
        sort: 'due_date',
      })
      setPendingBills(bills.items)
    } catch (e) {
      console.error(e)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('appointments', () => loadData(), !!user)
  useRealtime('financial_records', () => loadData(), !!user)

  const handleRegisterTime = async (type: string) => {
    try {
      setTrackingLoading(true)
      await pb.collection('time_entries').create({
        secretary: user?.id,
        entry_type: type,
        is_manual_adjustment: false,
      })
      loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setTrackingLoading(false)
    }
  }

  const handleCheckIn = async (id: string) => {
    try {
      await pb.collection('appointments').update(id, { status: 'realizado' })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const lastEntry = todayEntries.length > 0 ? todayEntries[0] : null
  const isPontoAberto =
    lastEntry && (lastEntry.entry_type === 'entrada' || lastEntry.entry_type === 'volta_pausa')

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Home da Recepção
          </h1>
          <p className="text-gray-500 mt-1 capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            className="bg-white hover:bg-blue-50 hover:text-blue-700"
          >
            <Link to="/patients/new">
              <UserPlus className="mr-2 h-4 w-4" /> Novo Paciente
            </Link>
          </Button>
          <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white">
            <Link to="/agenda">
              <Calendar className="mr-2 h-4 w-4" /> Ver Agenda
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-t-4 border-t-teal-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Sessões Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Aguardando</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waiting}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-orange-500 bg-orange-50/30 dark:bg-orange-950/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ponto Eletrônico</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Status:{' '}
              {isPontoAberto ? (
                <span className="text-green-600">Trabalhando</span>
              ) : (
                <span className="text-gray-500">Inativo</span>
              )}
            </div>
            <div className="flex gap-2">
              {!isPontoAberto ? (
                <Button
                  size="sm"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => handleRegisterTime('entrada')}
                  disabled={trackingLoading}
                >
                  Registrar Entrada
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-100"
                    onClick={() => handleRegisterTime('saida_pausa')}
                    disabled={trackingLoading}
                  >
                    Pausa
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-gray-800 hover:bg-gray-900 text-white"
                    onClick={() => handleRegisterTime('saida')}
                    disabled={trackingLoading}
                  >
                    Saída
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
            <div>
              <CardTitle>Pacientes do Dia</CardTitle>
              <CardDescription>Sessões previstas (Check-in rápido).</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm">
                  <Calendar className="h-8 w-8 mb-2 opacity-20" />
                  Nenhuma sessão para hoje.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {apt.expand?.patient?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {apt.expand?.patient?.name || 'Sem nome'}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 mt-0.5 gap-1 sm:gap-3">
                            <span className="flex items-center gap-1 font-medium text-teal-600">
                              <Clock className="h-3 w-3" />{' '}
                              {apt.start_time || format(new Date(apt.scheduled_date), 'HH:mm')}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" /> Dr(a).{' '}
                              {apt.expand?.professional?.name?.split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      </div>
                      {apt.status === 'agendado' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleCheckIn(apt.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Check-in
                        </Button>
                      ) : (
                        <Badge
                          variant="outline"
                          className={
                            apt.status === 'realizado'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : apt.status === 'cancelado'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                          }
                        >
                          {apt.status}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
            <div>
              <CardTitle>Cobranças Pendentes</CardTitle>
              <CardDescription>Avisos de inadimplência próximos.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-primary hover:text-primary/80"
            >
              <Link to="/financeiro">
                Acessar <DollarSign className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {pendingBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm">
                  <DollarSign className="h-8 w-8 mb-2 opacity-20" />
                  Nenhuma cobrança pendente.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pendingBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex flex-col p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {bill.expand?.patient?.name || 'Avulso'}
                        </span>
                        <span className="font-bold text-red-600 text-sm">
                          R$ {bill.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Vencimento: {format(new Date(bill.due_date), 'dd/MM/yyyy')}</span>
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200 text-[10px] uppercase"
                        >
                          Pendente
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
