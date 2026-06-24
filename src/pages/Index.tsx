import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Calendar as CalendarIcon,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  CalendarPlus,
  UserPlus,
  FilePlus,
  BarChart,
  BrainCircuit,
  RotateCcw,
  Clock,
  TrendingDown,
  Info,
} from 'lucide-react'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  format,
  subDays,
  differenceInDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { WelcomeTour } from '@/components/WelcomeTour'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

export default function Index() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('month')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [crisisAlerts, setCrisisAlerts] = useState<any[]>([])
  const [selectedCrisis, setSelectedCrisis] = useState<any>(null)
  const [confirmingEmergency, setConfirmingEmergency] = useState(false)

  const getPeriodDates = (period: string) => {
    const now = new Date()
    switch (period) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) }
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 0 }),
          end: endOfWeek(now, { weekStartsOn: 0 }),
        }
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case '3months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) }
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) }
    }
  }

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const anyApp = await pb.collection('appointments').getList(1, 1, {
        filter: `professional = "${user.id}" && deleted_at = ""`,
      })
      if (anyApp.totalItems === 0) {
        setIsFirstTime(true)
        setLoading(false)
        return
      }
      setIsFirstTime(false)

      const { start, end } = getPeriodDates(filter)
      const startStr = format(start, 'yyyy-MM-dd HH:mm:ss')
      const endStr = format(end, 'yyyy-MM-dd HH:mm:ss')

      const [
        appsRes,
        finRes,
        inadimplenciaRes,
        insightsRes,
        activeAppsRes,
        allRealizado,
        recentApps,
      ] = await Promise.all([
        pb.collection('appointments').getFullList({
          filter: `professional = "${user.id}" && scheduled_date >= "${startStr}" && scheduled_date <= "${endStr}" && deleted_at = ""`,
          expand: 'patient',
          sort: 'scheduled_date',
        }),
        pb.collection('financial_records').getFullList({
          filter: `professional = "${user.id}" && payment_date >= "${startStr}" && payment_date <= "${endStr}" && deleted_at = ""`,
        }),
        pb.collection('financial_records').getFullList({
          filter: `professional = "${user.id}" && (status = "pendente" || status = "atrasado") && due_date < "${format(
            subDays(new Date(), 30),
            'yyyy-MM-dd',
          )}" && deleted_at = ""`,
        }),
        pb.collection('clinical_insights').getList(1, 5, {
          filter: `professional = "${user.id}"`,
          sort: '-created',
          expand: 'patient',
        }),
        pb.collection('appointments').getFullList({
          filter: `professional = "${user.id}" && scheduled_date >= "${format(
            subDays(new Date(), 90),
            'yyyy-MM-dd HH:mm:ss',
          )}" && status = "realizado" && deleted_at = ""`,
          fields: 'patient',
        }),
        pb.collection('appointments').getFullList({
          filter: `professional = "${user.id}" && status = "realizado" && deleted_at = ""`,
          fields: 'scheduled_date',
        }),
        pb.collection('appointments').getFullList({
          filter: `professional = "${user.id}" && created >= "${format(
            subDays(new Date(), 7),
            'yyyy-MM-dd HH:mm:ss',
          )}" && deleted_at = ""`,
          sort: '-created',
          expand: 'patient',
        }),
      ])

      // Only show insights for patients with AI consent
      const filteredInsights = insightsRes.items.filter((item) => item.expand?.patient?.ai_consent)

      const uniquePatients = new Set(activeAppsRes.map((a) => a.patient)).size

      const monthCounts: Record<string, number> = {}
      allRealizado.forEach((a) => {
        const m = a.scheduled_date.substring(0, 7)
        monthCounts[m] = (monthCounts[m] || 0) + 1
      })
      let bestMonth = ''
      let bestMonthCount = 0
      Object.entries(monthCounts).forEach(([m, count]) => {
        if (count > bestMonthCount) {
          bestMonthCount = count
          bestMonth = m
        }
      })

      const returnAlerts: any[] = []
      const recentPatientsMap = new Map()
      recentApps.forEach((a) => {
        if (!recentPatientsMap.has(a.patient)) recentPatientsMap.set(a.patient, a)
      })

      for (const [patId, app] of recentPatientsMap.entries()) {
        const prevApps = await pb.collection('appointments').getList(1, 1, {
          filter: `professional = "${user.id}" && patient = "${patId}" && id != "${app.id}" && scheduled_date < "${app.scheduled_date}" && deleted_at = ""`,
          sort: '-scheduled_date',
        })
        if (prevApps.items.length > 0) {
          const prevDate = new Date(prevApps.items[0].scheduled_date)
          const currDate = new Date(app.scheduled_date)
          const diff = differenceInDays(currDate, prevDate)
          if (diff > 30) {
            returnAlerts.push({
              patient: app.expand?.patient,
              days: diff,
              date: app.created,
            })
          }
        }
      }

      setData({
        appointments: appsRes,
        financial: finRes,
        inadimplencia: inadimplenciaRes,
        insights: filteredInsights,
        uniquePatients,
        bestMonth: bestMonth ? { month: bestMonth, count: bestMonthCount } : null,
        returnAlerts,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadCrisisAlerts = async () => {
    if (!user) return
    try {
      const alerts = await pb.collection('notifications').getFullList({
        filter: `profile = "${user.id}" && type = "crisis" && read = false`,
        expand: 'patient',
      })
      setCrisisAlerts(alerts)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
    loadCrisisAlerts()
  }, [user, filter])

  useRealtime('appointments', () => loadData())
  useRealtime('financial_records', () => loadData())
  useRealtime('clinical_insights', () => loadData())
  useRealtime('notifications', () => loadCrisisAlerts())

  const handleCrisisAction = async (actionType: 'emergency' | 'cvv' | 'aware') => {
    if (!selectedCrisis) return
    try {
      let actionText = ''

      if (actionType === 'emergency') {
        if (!confirmingEmergency) {
          setConfirmingEmergency(true)
          return
        }
        await pb.send('/backend/v1/crisis/contact', {
          method: 'POST',
          body: JSON.stringify({ patient_id: selectedCrisis.patient }),
        })
        actionText = `Acionado contato de emergência: ${selectedCrisis.expand?.patient?.emergency_contact_name || 'Desconhecido'} (${selectedCrisis.expand?.patient?.emergency_contact_phone || 'Sem número'}). Sistema enviou aviso automático.`
      } else if (actionType === 'cvv') {
        actionText = 'Orientado contato com CVV (188).'
      } else {
        actionText = 'Ciente do alerta, nenhuma ação externa imediata registrada.'
      }

      await pb.collection('session_notes').create({
        patient: selectedCrisis.patient,
        professional: user.id,
        content: `Gatilho detectado: ${selectedCrisis.body}\n\nAção: ${actionText}`,
        evolution_type: 'Intervenção em crise',
        status: 'finalizado',
        session_date: new Date().toISOString(),
      })

      await pb
        .collection('notifications')
        .update(selectedCrisis.id, { read: true, read_at: new Date().toISOString() })

      toast({ title: 'Protocolo registrado com sucesso' })
      setSelectedCrisis(null)
      setConfirmingEmergency(false)
      loadCrisisAlerts()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const faturamentoTotal = useMemo(() => {
    if (!data) return 0
    return data.financial
      .filter((f: any) => f.status === 'pago')
      .reduce((acc: number, curr: any) => acc + (curr.total || curr.value || 0), 0)
  }, [data])

  const inadimplenciaTotal = useMemo(() => {
    if (!data) return 0
    return data.inadimplencia.reduce(
      (acc: number, curr: any) => acc + (curr.total || curr.value || 0),
      0,
    )
  }, [data])

  const noShowPercentage = useMemo(() => {
    if (!data || data.appointments.length === 0) return 0
    const faltas = data.appointments.filter((a: any) => a.status === 'falta').length
    return (faltas / data.appointments.length) * 100
  }, [data])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-5">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (isFirstTime) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-fade-in text-center px-4">
        <div className="bg-teal-50 p-6 rounded-full mb-4">
          <CalendarIcon className="h-12 w-12 text-teal-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Bem-vindo(a) ao Skip!
        </h2>
        <p className="text-gray-500 max-w-md">
          Você ainda não tem sessões registradas. Que tal começar cadastrando o seu primeiro
          paciente e agendando uma sessão?
        </p>
        <div className="flex gap-4 mt-6">
          <Button asChild>
            <Link to="/patients/new">Novo Paciente</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/agenda">Ver Agenda</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {crisisAlerts.length > 0 && (
        <div className="space-y-3">
          {crisisAlerts.map((alert) => (
            <Alert
              key={alert.id}
              className="bg-red-600 text-white border-red-800 cursor-pointer shadow-lg animate-fade-in-down"
              onClick={() => {
                setSelectedCrisis(alert)
                setConfirmingEmergency(false)
              }}
            >
              <AlertTriangle className="h-6 w-6 text-white" />
              <AlertTitle className="font-bold text-lg">
                🚨 ALERTA DE CRISE — {alert.expand?.patient?.name}
              </AlertTitle>
              <AlertDescription className="text-red-50 mt-1">
                <div className="mb-2">{alert.body}</div>
                <div className="font-bold text-white mb-2">📞 Ligue CVV 188</div>
                <div className="mt-3 font-semibold underline text-white">
                  Clique aqui para abrir o protocolo de intervenção imediata.
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Olá, {user?.name?.split(' ')[0] || 'Doutor(a)'} 👋
          </h1>
          <p className="text-gray-500 mt-1 capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="3months">Últimos 3 Meses</SelectItem>
            <SelectItem value="year">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          asChild
          variant="outline"
          className="bg-white hover:bg-teal-50 hover:text-teal-700 border-teal-100 dark:bg-gray-900 dark:hover:bg-teal-900/30 dark:border-teal-900"
        >
          <Link to="/agenda">
            <CalendarPlus className="mr-2 h-4 w-4" /> Nova Sessão
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="bg-white hover:bg-blue-50 hover:text-blue-700 border-blue-100 dark:bg-gray-900 dark:hover:bg-blue-900/30 dark:border-blue-900"
        >
          <Link to="/patients/new">
            <UserPlus className="mr-2 h-4 w-4" /> Novo Paciente
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="bg-white hover:bg-purple-50 hover:text-purple-700 border-purple-100 dark:bg-gray-900 dark:hover:bg-purple-900/30 dark:border-purple-900"
        >
          <Link to="/notes">
            <FilePlus className="mr-2 h-4 w-4" /> Nova Evolução
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="bg-white hover:bg-green-50 hover:text-green-700 border-green-100 dark:bg-gray-900 dark:hover:bg-green-900/30 dark:border-green-900"
        >
          <Link to="/financeiro">
            <DollarSign className="mr-2 h-4 w-4" /> Nova Cobrança
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="bg-white hover:bg-orange-50 hover:text-orange-700 border-orange-100 dark:bg-gray-900 dark:hover:bg-orange-900/30 dark:border-orange-900"
        >
          <Link to="/financeiro?tab=reports">
            <BarChart className="mr-2 h-4 w-4" /> Relatórios
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm border-t-4 border-t-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" /> Pacientes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.uniquePatients || 0}</div>
            <p className="text-[10px] text-gray-400 mt-1">Sessões nos últimos 90 dias</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-teal-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-teal-500" /> Sessões no Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.appointments?.length || 0}</div>
            <Link
              to="/agenda"
              className="text-xs text-teal-600 hover:underline flex items-center mt-1"
            >
              Ver Agenda <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" /> Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-500">
              R$ {faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Recebido no período</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" /> Inadimplência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-500">
              R$ {inadimplenciaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">+30 dias de atraso (Total)</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" /> No-Show
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{noShowPercentage.toFixed(1)}%</div>
            <p className="text-[10px] text-gray-400 mt-1">Taxa de faltas no período</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Alerts & Agenda */}
        <div className="md:col-span-2 space-y-6">
          {data?.returnAlerts?.length > 0 && (
            <div className="space-y-3">
              {data.returnAlerts.map((alert: any, i: number) => (
                <Alert
                  key={i}
                  className="bg-teal-50/50 border-teal-200 dark:bg-teal-950/20 dark:border-teal-900"
                >
                  <RotateCcw className="h-4 w-4 text-teal-600" />
                  <AlertTitle className="text-teal-800 dark:text-teal-400 flex items-center gap-2">
                    Retorno de Paciente
                    <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-[10px]">
                      Novo
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="text-teal-700 dark:text-teal-500">
                    <strong>{alert.patient?.name}</strong> agendou uma sessão após {alert.days} dias
                    de ausência. Que bom tê-lo de volta!
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <div>
                <CardTitle>Sessões no Período</CardTitle>
                <CardDescription>
                  Você tem {data?.appointments?.length || 0} sessões registradas.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex text-teal-600">
                <Link to="/agenda">
                  Ver Agenda Completa <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {data?.appointments?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm">
                    <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
                    Nenhuma sessão agendada para este período.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data?.appointments?.map((apt: any) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {apt.expand?.patient?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {apt.expand?.patient?.name}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 mt-0.5 gap-2">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {format(new Date(apt.scheduled_date), 'dd/MM/yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {apt.start_time || format(new Date(apt.scheduled_date), 'HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            apt.status === 'agendado'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : apt.status === 'realizado'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : apt.status === 'cancelado'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : apt.status === 'falta'
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                          }
                        >
                          {apt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Smart Alerts */}
        <div className="space-y-6">
          <Card className="shadow-sm border border-purple-100 dark:border-purple-900/50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BrainCircuit className="h-5 w-5" />
                Prontuário Inteligente
              </CardTitle>
              <CardDescription className="text-purple-100 mt-1">
                Alertas e insights clínicos recentes
              </CardDescription>
            </div>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {data?.insights?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm p-6 text-center">
                    <Info className="h-8 w-8 mb-2 opacity-20" />
                    Nenhum alerta clínico gerado recentemente.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data?.insights?.map((insight: any) => {
                      let riskLevel = 'informativo'
                      if (Array.isArray(insight.risk_alerts) && insight.risk_alerts.length > 0) {
                        const alertText = insight.risk_alerts[0].toLowerCase()
                        if (
                          alertText.includes('alto') ||
                          alertText.includes('grave') ||
                          alertText.includes('suicídio')
                        ) {
                          riskLevel = 'alto'
                        } else if (alertText.includes('médio') || alertText.includes('atenção')) {
                          riskLevel = 'médio'
                        }
                      }

                      const riskStyle =
                        riskLevel === 'alto'
                          ? 'bg-red-50 dark:bg-red-950/20 text-red-800 border-l-4 border-l-red-500'
                          : riskLevel === 'médio'
                            ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 border-l-4 border-l-yellow-500'
                            : 'bg-gray-50 dark:bg-gray-900 text-gray-800 border-l-4 border-l-gray-300'

                      return (
                        <div key={insight.id} className={`p-4 ${riskStyle} transition-colors`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">
                              {insight.expand?.patient?.name || 'Paciente Desconhecido'}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                riskLevel === 'alto'
                                  ? 'border-red-200 bg-white text-red-600'
                                  : riskLevel === 'médio'
                                    ? 'border-yellow-200 bg-white text-yellow-600'
                                    : 'border-gray-200 bg-white text-gray-600'
                              }
                            >
                              {riskLevel === 'alto'
                                ? 'Risco'
                                : riskLevel === 'médio'
                                  ? 'Atenção'
                                  : 'Insight'}
                            </Badge>
                          </div>
                          <p className="text-xs leading-relaxed opacity-90 line-clamp-3">
                            {insight.summary ||
                              insight.intervention_suggestion ||
                              'Nenhum detalhe disponível.'}
                          </p>
                          <div className="mt-3 flex justify-end">
                            <Button
                              asChild
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-[10px] uppercase font-bold"
                            >
                              <Link to={`/patients/${insight.patient}`}>Ver Prontuário</Link>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {data?.bestMonth && (
        <div className="mt-8 flex items-center justify-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border border-teal-100 dark:border-teal-900/50 px-6 py-3 rounded-full text-sm text-teal-800 dark:text-teal-300 shadow-sm">
            <BarChart className="h-5 w-5 text-teal-600" />
            <span>
              Seu melhor mês histórico foi{' '}
              <strong>
                {format(new Date(data.bestMonth.month + '-01T00:00:00'), "MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </strong>
              , com a realização de <strong>{data.bestMonth.count}</strong> sessões. Parabéns! 🚀
            </span>
          </div>
        </div>
      )}

      <WelcomeTour />

      <Dialog
        open={!!selectedCrisis}
        onOpenChange={(o) => {
          if (!o) {
            setSelectedCrisis(null)
            setConfirmingEmergency(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-md border-t-4 border-t-red-600">
          <DialogHeader>
            <DialogTitle className="text-xl text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Protocolo de Crise
            </DialogTitle>
            <DialogDescription>
              Ação imediata para <strong>{selectedCrisis?.expand?.patient?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {!confirmingEmergency ? (
              <>
                <Button
                  onClick={() => handleCrisisAction('emergency')}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 flex flex-col items-start gap-1 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                >
                  <span className="font-bold flex items-center gap-2">
                    📞 Acionar contato de emergência
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-normal text-left">
                    {selectedCrisis?.expand?.patient?.emergency_contact_name || 'Não cadastrado'} -{' '}
                    {selectedCrisis?.expand?.patient?.emergency_contact_phone || 'Sem número'}
                  </span>
                </Button>
                <Button
                  onClick={() => handleCrisisAction('cvv')}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 flex flex-col items-start gap-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                >
                  <span className="font-bold flex items-center gap-2">
                    📞 Acionar CVV — Centro de Valorização da Vida (188)
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-normal text-left">
                    CVV — Centro de Valorização da Vida. Ligue 188 (24h).
                  </span>
                </Button>
                <Button
                  onClick={() => handleCrisisAction('aware')}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 flex flex-col items-start gap-1"
                >
                  <span className="font-bold flex items-center gap-2">
                    ✅ Já estou ciente. Apenas registrar.
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-normal text-left">
                    Apenas registrar a ciência do evento no prontuário do paciente. Nenhuma ação
                    externa será tomada.
                  </span>
                </Button>
              </>
            ) : (
              <div className="bg-red-50 p-4 rounded-md border border-red-100">
                <p className="font-medium text-red-900 mb-2">
                  Deseja que o sistema envie uma mensagem automática para o contato?
                </p>
                <p className="text-sm text-red-700 mb-4">
                  A seguinte mensagem SMS será enviada: "O Syntra identificou um sinal de alerta no
                  diário de {selectedCrisis?.expand?.patient?.name}. Entre em contato com urgência.
                  Em caso de crise, ligue CVV 188."
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setConfirmingEmergency(false)}>
                    Voltar
                  </Button>
                  <Button
                    onClick={() => handleCrisisAction('emergency')}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Sim, Enviar Alerta
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
