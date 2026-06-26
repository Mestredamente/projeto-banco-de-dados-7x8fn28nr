import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle,
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  UserCheck,
} from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import pb from '@/lib/pocketbase/client'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format, subMonths, startOfMonth, endOfMonth, isAfter, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const Variation = ({ value, invert = false }: { value: number; invert?: boolean }) => {
  if (value === 0 || isNaN(value))
    return <span className="text-sm text-muted-foreground mt-1 block">0%</span>
  const isPositive = value > 0
  const isGood = invert ? !isPositive : isPositive
  const color = isGood ? 'text-green-600' : 'text-red-600'
  const Icon = isPositive ? TrendingUp : TrendingDown
  return (
    <div className={`flex items-center text-sm font-medium ${color} mt-1`}>
      <Icon className="w-4 h-4 mr-1" />
      <span>{Math.abs(value).toFixed(1)}%</span>
      <span className="text-muted-foreground font-normal ml-1 text-xs">vs ant.</span>
    </div>
  )
}

const trendConfig: ChartConfig = {
  mrr: { label: 'MRR (R$)', color: 'hsl(var(--primary))' },
  churn: { label: 'Churn (%)', color: 'hsl(var(--destructive))' },
}

const popConfig: ChartConfig = {
  count: { label: 'Assinantes', color: 'hsl(var(--chart-4))' },
}

const roleConfig: ChartConfig = {
  psicologo_autonomo: { label: 'Autônomo', color: 'hsl(var(--chart-1))' },
  admin_clinica: { label: 'Clínica', color: 'hsl(var(--chart-2))' },
  psicologo_vinculado: { label: 'Vinculado', color: 'hsl(var(--chart-3))' },
}

export function DashboardTab() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    mrr: 0,
    mrrVariation: 0,
    activeSubscribers: 0,
    activeVariation: 0,
    churnRate: 0,
    churnVariation: 0,
    conversionRate: 0,
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [roleDistribution, setRoleDistribution] = useState<any[]>([])
  const [planPopularity, setPlanPopularity] = useState<any[]>([])
  const [cohortData, setCohortData] = useState<any[]>([])
  const [recentSubscribers, setRecentSubscribers] = useState<any[]>([])
  const [recentCancellations, setRecentCancellations] = useState<any[]>([])
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const subs = await pb.collection('subscriptions').getFullList({ expand: 'plan,subscriber' })
        const users = await pb
          .collection('users')
          .getFullList({
            filter:
              "role = 'psicologo_autonomo' || role = 'admin_clinica' || role = 'psicologo_vinculado'",
          })
        const plans = await pb.collection('plans').getFullList()

        const now = new Date()
        const currentMonthStart = startOfMonth(now)
        const lastMonthStart = startOfMonth(subMonths(now, 1))
        const lastMonthEnd = endOfMonth(subMonths(now, 1))

        const isActiveAt = (date: Date) => (sub: any) => {
          const created = new Date(sub.created)
          if (created > date) return false
          if (sub.status === 'canceled' && sub.canceled_at) {
            const canceled = new Date(sub.canceled_at)
            return canceled > date
          }
          return true
        }

        // Metrics
        const currentActive = subs.filter(isActiveAt(now))
        const lastMonthActiveSubs = subs.filter(isActiveAt(lastMonthEnd))

        const mrr = currentActive.reduce((acc, sub) => acc + (sub.expand?.plan?.price || 0), 0)
        const lastMonthMRR = lastMonthActiveSubs.reduce(
          (acc, sub) => acc + (sub.expand?.plan?.price || 0),
          0,
        )
        const mrrVariation =
          lastMonthMRR > 0 ? ((mrr - lastMonthMRR) / lastMonthMRR) * 100 : mrr > 0 ? 100 : 0

        const activeSubscribers = currentActive.length
        const lastMonthActive = lastMonthActiveSubs.length
        const activeVariation =
          lastMonthActive > 0
            ? ((activeSubscribers - lastMonthActive) / lastMonthActive) * 100
            : activeSubscribers > 0
              ? 100
              : 0

        // Churn
        const cancelsThisMonth = subs.filter(
          (s) =>
            s.status === 'canceled' &&
            s.canceled_at &&
            new Date(s.canceled_at) >= currentMonthStart &&
            new Date(s.canceled_at) <= now,
        )
        const activeAtStart = subs.filter(isActiveAt(currentMonthStart)).length
        const churnRate = activeAtStart > 0 ? (cancelsThisMonth.length / activeAtStart) * 100 : 0

        const cancelsLastMonth = subs.filter(
          (s) =>
            s.status === 'canceled' &&
            s.canceled_at &&
            new Date(s.canceled_at) >= lastMonthStart &&
            new Date(s.canceled_at) <= lastMonthEnd,
        )
        const activeAtStartLast = subs.filter(isActiveAt(lastMonthStart)).length
        const lastMonthChurnRate =
          activeAtStartLast > 0 ? (cancelsLastMonth.length / activeAtStartLast) * 100 : 0
        const churnVariation = churnRate - lastMonthChurnRate

        // Conversion
        const recentTrials = subs.filter(
          (s) => s.trial_ends_at && new Date(s.created) >= subMonths(now, 2),
        )
        const converted = recentTrials.filter((s) => s.status === 'active')
        const conversionRate =
          recentTrials.length > 0 ? (converted.length / recentTrials.length) * 100 : 0

        // Trend Chart & Billing History
        const trendData = []
        const billingHist = []
        for (let i = 11; i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(now, i))
          const monthEnd = endOfMonth(subMonths(now, i))
          const monthName = format(monthStart, 'MMM/yy', { locale: ptBR })

          const actAtEnd = subs.filter(isActiveAt(monthEnd))
          const monthMRR = actAtEnd.reduce((acc, sub) => acc + (sub.expand?.plan?.price || 0), 0)

          const actAtStart = subs.filter(isActiveAt(monthStart))
          const cancels = subs.filter(
            (s) =>
              s.status === 'canceled' &&
              s.canceled_at &&
              new Date(s.canceled_at) >= monthStart &&
              new Date(s.canceled_at) <= monthEnd,
          )
          const monthChurn = actAtStart.length > 0 ? (cancels.length / actAtStart.length) * 100 : 0

          trendData.push({ month: monthName, mrr: monthMRR, churn: monthChurn })
          billingHist.push({
            month: monthName,
            mrr: monthMRR,
            subscribers: actAtEnd.length,
            cancels: cancels.length,
            variation: 0,
          })
        }

        billingHist.forEach((item, idx) => {
          if (idx > 0) {
            const prev = billingHist[idx - 1].mrr
            item.variation = prev > 0 ? ((item.mrr - prev) / prev) * 100 : 0
          }
        })

        // Role distribution
        const rDist = [
          {
            role: 'psicologo_autonomo',
            count: users.filter((u) => u.role === 'psicologo_autonomo').length,
          },
          { role: 'admin_clinica', count: users.filter((u) => u.role === 'admin_clinica').length },
          {
            role: 'psicologo_vinculado',
            count: users.filter((u) => u.role === 'psicologo_vinculado').length,
          },
        ].filter((r) => r.count > 0)

        // Plan popularity
        const planPop = plans
          .map((p) => {
            const count = currentActive.filter((s) => s.plan === p.id).length
            return { plan: p.name, count }
          })
          .filter((p) => p.count > 0)

        // Cohorts
        const cohorts = []
        for (let i = 11; i >= 0; i--) {
          const cohortStart = startOfMonth(subMonths(now, i))
          const cohortEnd = endOfMonth(subMonths(now, i))
          const joined = subs.filter((s) => {
            const c = new Date(s.created)
            return c >= cohortStart && c <= cohortEnd
          })

          if (joined.length === 0) continue

          const retention = []
          for (let j = 0; j <= i; j++) {
            const checkDate = endOfMonth(subMonths(now, i - j))
            const active = joined.filter(isActiveAt(checkDate))
            retention.push((active.length / joined.length) * 100)
          }
          cohorts.push({
            month: format(cohortStart, 'MMM/yyyy', { locale: ptBR }),
            joined: joined.length,
            retention,
          })
        }

        // Recent Activity
        const recSubs = [...subs]
          .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
          .slice(0, 10)
        const recCancels = subs
          .filter((s) => s.status === 'canceled')
          .sort((a, b) => new Date(b.canceled_at).getTime() - new Date(a.canceled_at).getTime())
          .slice(0, 10)

        // Alerts
        const newAlerts = []
        if (churnRate > 10) {
          newAlerts.push({
            type: 'destructive',
            title: 'Alerta de Churn',
            desc: `O Churn Rate atual (${churnRate.toFixed(1)}%) está acima de 10% neste mês.`,
          })
        }
        const expTrials = currentActive.filter(
          (s) =>
            s.status === 'trial' &&
            s.trial_ends_at &&
            isAfter(new Date(s.trial_ends_at), now) &&
            differenceInDays(new Date(s.trial_ends_at), now) <= 3,
        )
        if (expTrials.length > 5) {
          newAlerts.push({
            type: 'warning',
            title: 'Aviso de Conversão',
            desc: `Existem ${expTrials.length} assinaturas em período de teste expirando nos próximos 3 dias.`,
          })
        }
        if (mrr < lastMonthMRR * 0.9 && lastMonthMRR > 0) {
          const drop = ((lastMonthMRR - mrr) / lastMonthMRR) * 100
          newAlerts.push({
            type: 'destructive',
            title: 'Queda de Receita',
            desc: `O MRR caiu ${drop.toFixed(1)}% em relação ao mês anterior.`,
          })
        }

        setMetrics({
          mrr,
          mrrVariation,
          activeSubscribers,
          activeVariation,
          churnRate,
          churnVariation,
          conversionRate,
        })
        setChartData(trendData)
        setBillingHistory([...billingHist].reverse())
        setRoleDistribution(rDist)
        setPlanPopularity(planPop)
        setCohortData(cohorts)
        setRecentSubscribers(recSubs)
        setRecentCancellations(recCancels)
        setAlerts(newAlerts)
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px]" />
      </div>
    )

  return (
    <div className="space-y-6">
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, idx) => (
            <Alert
              key={idx}
              variant={alert.type === 'destructive' ? 'destructive' : 'default'}
              className={
                alert.type === 'warning' ? 'border-yellow-500 text-yellow-700 bg-yellow-50/50' : ''
              }
            >
              {alert.type === 'destructive' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.desc}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.mrr)}</div>
            <Variation value={metrics.mrrVariation} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSubscribers}</div>
            <Variation value={metrics.activeVariation} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversão de Teste</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Últimos 60 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate (Mês)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${metrics.churnRate > 10 ? 'text-red-600' : metrics.churnRate > 5 ? 'text-yellow-600' : 'text-green-600'}`}
            >
              {metrics.churnRate.toFixed(2)}%
            </div>
            <Variation value={metrics.churnVariation} invert />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Receita vs Churn (12 Meses)</CardTitle>
            <CardDescription>MRR e taxa de cancelamento ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ChartContainer config={trendConfig} className="h-[300px] w-full">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    yAxisId="left"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `R$${val}`}
                    width={60}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}%`}
                    width={40}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="mrr"
                    stroke="var(--color-mrr)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="churn"
                    stroke="var(--color-churn)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aguardando dados
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-rows-2 gap-4 col-span-2 md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Popularidade dos Planos</CardTitle>
            </CardHeader>
            <CardContent>
              {planPopularity.length > 0 ? (
                <ChartContainer config={popConfig} className="h-[140px] w-full">
                  <BarChart data={planPopularity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="plan" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} width={30} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[140px] flex items-center justify-center text-muted-foreground">
                  Aguardando dados
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Distribuição por Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              {roleDistribution.length > 0 ? (
                <ChartContainer config={roleConfig} className="h-[140px] w-full">
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      dataKey="count"
                      nameKey="role"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                    >
                      {roleDistribution.map((entry) => (
                        <Cell key={entry.role} fill={`var(--color-${entry.role})`} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <ChartLegend
                      content={<ChartLegendContent />}
                      className="-translate-y-2 flex-wrap"
                    />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="h-[140px] flex items-center justify-center text-muted-foreground">
                  Aguardando dados
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retenção por Safra (Cohort)</CardTitle>
          <CardDescription>Percentual de clientes retidos desde o mês de entrada</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Mês</TableHead>
                <TableHead>Novos</TableHead>
                {Array.from({ length: 12 }).map((_, i) => (
                  <TableHead key={i} className="min-w-[70px] text-center">
                    Mês {i}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohortData.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row.month}</TableCell>
                  <TableCell>{row.joined}</TableCell>
                  {row.retention.map((val: number, i: number) => {
                    const opacity = val / 100
                    return (
                      <TableCell
                        key={i}
                        className="text-center font-medium"
                        style={{
                          backgroundColor: `rgba(16, 185, 129, ${opacity * 0.7})`,
                          color: opacity > 0.5 ? 'white' : 'inherit',
                        }}
                      >
                        {val.toFixed(0)}%
                      </TableCell>
                    )
                  })}
                  {Array.from({ length: 12 - row.retention.length }).map((_, i) => (
                    <TableCell key={`empty-${i}`} />
                  ))}
                </TableRow>
              ))}
              {cohortData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={14} className="text-center py-6 text-muted-foreground">
                    Aguardando dados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos Assinantes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubscribers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSubscribers.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="font-medium">
                          {sub.expand?.subscriber?.name || 'Sem nome'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sub.expand?.subscriber?.email}
                        </div>
                      </TableCell>
                      <TableCell>{sub.expand?.plan?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sub.status === 'active'
                              ? 'default'
                              : sub.status === 'trial'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-6 text-center text-muted-foreground">Aguardando dados</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos Cancelamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCancellations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCancellations.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="font-medium">
                          {sub.expand?.subscriber?.name || 'Sem nome'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(sub.canceled_at), 'dd/MM/yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>{sub.expand?.plan?.name || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {sub.cancellation_reason || sub.cancelled_reason || 'Não informado'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-6 text-center text-muted-foreground">Aguardando dados</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturamento</CardTitle>
          <CardDescription>Variação mensal de MRR e assinantes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Assinantes</TableHead>
                <TableHead>Cancelamentos</TableHead>
                <TableHead>Faturamento (MRR)</TableHead>
                <TableHead>Variação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingHistory.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row.month}</TableCell>
                  <TableCell>{row.subscribers}</TableCell>
                  <TableCell>{row.cancels}</TableCell>
                  <TableCell>{formatCurrency(row.mrr)}</TableCell>
                  <TableCell>
                    <Variation value={row.variation} />
                  </TableCell>
                </TableRow>
              ))}
              {billingHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Aguardando dados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
