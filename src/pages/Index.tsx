import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  UserPlus,
  CalendarPlus,
  FileText,
  ArrowRight,
  Clock,
  BarChart2,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRealtime } from '@/hooks/use-realtime'

export default function IndexBase() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    activePatients: 0,
    sessionsToday: 0,
    monthlyRevenue: 0,
    pendencies: 0,
    alerts: 0,
  })
  const [recentPatients, setRecentPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasNoData, setHasNoData] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      const activePts = await pb.collection('patients').getList(1, 1, {
        filter: `deleted_at = "" && is_active = true`,
      })

      const allPts = await pb.collection('patients').getList(1, 1, { filter: `deleted_at = ""` })
      setHasNoData(allPts.totalItems === 0)

      const sessions = await pb.collection('appointments').getList(1, 1, {
        filter: `scheduled_date >= "${today} 00:00:00" && scheduled_date <= "${today} 23:59:59" && deleted_at = ""`,
      })

      const pendencies = await pb.collection('session_notes').getList(1, 1, {
        filter: `status = "rascunho" && deleted_at = ""`,
      })

      const alerts = await pb.collection('ai_alerts').getList(1, 1, {
        filter: `is_resolved = false`,
      })

      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0]
      const finRecords = await pb.collection('financial_records').getFullList({
        filter: `payment_date >= "${firstDay} 00:00:00" && status = "pago" && deleted_at = ""`,
      })
      const totalRev = finRecords.reduce((acc, curr) => acc + (curr.value || 0), 0)

      setStats({
        activePatients: activePts.totalItems,
        sessionsToday: sessions.totalItems,
        monthlyRevenue: totalRev,
        pendencies: pendencies.totalItems,
        alerts: alerts.totalItems,
      })

      const recent = await pb.collection('patients').getList(1, 5, {
        filter: `deleted_at = ""`,
        sort: '-updated',
      })
      setRecentPatients(recent.items)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user, loadData])

  useRealtime('appointments', () => loadData(), !!user)
  useRealtime('patients', () => loadData(), !!user)

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse">Carregando dashboard...</div>
    )
  }

  if (hasNoData) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] animate-fade-in-up">
        <img
          src="https://img.usecurling.com/p/400/300?q=doctor%20welcome&color=blue"
          alt="Bem-vindo"
          className="mb-8 rounded-lg shadow-md max-w-sm"
        />
        <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white tracking-tight">
          Bem-vindo ao Syntra!
        </h1>
        <p className="text-gray-500 mb-8 max-w-md text-center leading-relaxed">
          Parece que você ainda não tem pacientes cadastrados. Comece agora mesmo a gerenciar seus
          atendimentos de forma inteligente.
        </p>
        <Button asChild size="lg" className="h-12 px-8">
          <Link to="/patients/new">
            <UserPlus className="mr-2 h-5 w-5" /> Cadastrar Meu Primeiro Paciente
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1 capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
            <Link to="/patients/new">
              <UserPlus className="mr-2 h-4 w-4" /> Novo Paciente
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
            <Link to="/agenda">
              <CalendarPlus className="mr-2 h-4 w-4" /> Nova Sessão
            </Link>
          </Button>
          <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white">
            <Link to="/notes">
              <FileText className="mr-2 h-4 w-4" /> Nova Evolução
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pacientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePatients}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-t-4 border-t-teal-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Sessões Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sessionsToday}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-t-4 border-t-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Faturamento Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-t-4 border-t-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pendências</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendencies}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-t-4 border-t-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.alerts}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm md:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div>
              <CardTitle className="text-lg">Atividades Recentes</CardTitle>
              <CardDescription>Últimos pacientes acessados ou atualizados.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-primary hover:text-primary/80"
            >
              <Link to="/patients">
                Ver Todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentPatients.map((pt) => (
                <div
                  key={pt.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-semibold">
                      {pt.name?.charAt(0)}
                    </div>
                    <div>
                      <Link
                        to={`/patients/${pt.id}`}
                        className="font-medium text-sm hover:underline"
                      >
                        {pt.name}
                      </Link>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Atualizado em {format(new Date(pt.updated), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                    {pt.is_active ? 'Ativo' : 'Inativo'}
                  </div>
                </div>
              ))}
              {recentPatients.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500">
                  Nenhuma atividade recente.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-3">
            <CardTitle className="text-lg">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-2">
            <Button variant="outline" className="justify-start h-12" asChild>
              <Link to="/agenda">
                <Calendar className="mr-3 h-4 w-4 text-blue-500" /> Agenda Semanal
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-12" asChild>
              <Link to="/reports">
                <BarChart2 className="mr-3 h-4 w-4 text-purple-500" /> Relatórios Clínicos
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-12" asChild>
              <Link to="/financeiro">
                <DollarSign className="mr-3 h-4 w-4 text-green-500" /> Controle Financeiro
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
