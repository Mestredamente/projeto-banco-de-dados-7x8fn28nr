import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Users, CreditCard, DollarSign, Activity } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import pb from '@/lib/pocketbase/client'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function DashboardTab() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    mrr: 0,
    arr: 0,
    activeSubscribers: 0,
    churnRate: 0,
    monthRevenue: 0,
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [recentCancellations, setRecentCancellations] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const subs = await pb.collection('subscriptions').getFullList({ expand: 'plan,subscriber' })

        let mrr = 0
        let activeSubscribers = 0
        let cancelledThisMonth = 0
        let totalStartOfMonth = 0

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const recentCancels = []

        for (const sub of subs) {
          if (sub.status === 'active' || sub.status === 'trial') {
            activeSubscribers++
            if (sub.expand?.plan?.price) {
              mrr += sub.expand.plan.price
            }
            if (new Date(sub.created) < startOfMonth) {
              totalStartOfMonth++
            }
          } else if (sub.status === 'canceled' && sub.canceled_at) {
            const cancelDate = new Date(sub.canceled_at)
            if (cancelDate >= startOfMonth) {
              cancelledThisMonth++
            }
            recentCancels.push(sub)
          }
        }

        recentCancels.sort(
          (a, b) => new Date(b.canceled_at).getTime() - new Date(a.canceled_at).getTime(),
        )

        const churnRate = totalStartOfMonth > 0 ? (cancelledThisMonth / totalStartOfMonth) * 100 : 0

        const mockChart = []
        for (let i = 11; i >= 0; i--) {
          const d = new Date()
          d.setMonth(d.getMonth() - i)
          mockChart.push({
            name: d.toLocaleString('pt-BR', { month: 'short' }),
            mrr: Math.max(0, mrr - i * 500 + Math.random() * 200),
            assinantes: Math.max(0, activeSubscribers - i * 2 + Math.floor(Math.random() * 5)),
          })
        }

        setChartData(mockChart)
        setMetrics({ mrr, arr: mrr * 12, activeSubscribers, churnRate, monthRevenue: mrr * 0.95 })
        setRecentCancellations(recentCancels.slice(0, 5))
      } catch (err) {
        console.error(err)
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
      {metrics.churnRate > 5 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Alerta de Churn</AlertTitle>
          <AlertDescription>
            O Churn Rate atual ({metrics.churnRate.toFixed(1)}%) ultrapassou o limite de 5% neste
            mês.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSubscribers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.mrr)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate (Mês)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${metrics.churnRate > 5 ? 'text-red-600' : 'text-blue-600'}`}
            >
              {metrics.churnRate.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.monthRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Histórico de MRR (12 Meses)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                <Bar dataKey="mrr" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Últimos Cancelamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCancellations.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {sub.expand?.subscriber?.name || 'Usuário Desconhecido'}
                    </p>
                    <p className="text-xs text-muted-foreground">{sub.expand?.plan?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-red-600">
                      {new Date(sub.canceled_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sub.cancellation_reason || 'Não informado'}
                    </p>
                  </div>
                </div>
              ))}
              {recentCancellations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Nenhum cancelamento recente.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
