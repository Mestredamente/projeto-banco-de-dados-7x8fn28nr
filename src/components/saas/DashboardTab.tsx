import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/currency'

export function DashboardTab() {
  const data = [
    { month: 'Jan', mrr: 12000, subs: 120 },
    { month: 'Fev', mrr: 13500, subs: 135 },
    { month: 'Mar', mrr: 14000, subs: 140 },
    { month: 'Abr', mrr: 15200, subs: 150 },
    { month: 'Mai', mrr: 16800, subs: 165 },
    { month: 'Jun', mrr: 18000, subs: 180 },
  ]
  const churn = 2.5
  const activeSubs = 180
  const currentMrr = 18000
  const monthlyRevenue = 19200

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubs}</div>
            <p className="text-xs text-muted-foreground">+15 no último mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMrr)}</div>
            <p className="text-xs text-muted-foreground">ARR: {formatCurrency(currentMrr * 12)}</p>
          </CardContent>
        </Card>
        <Card className={churn > 5 ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Activity
              className={churn > 5 ? 'h-4 w-4 text-red-600' : 'h-4 w-4 text-muted-foreground'}
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${churn > 5 ? 'text-red-600' : ''}`}>{churn}%</div>
            <p className="text-xs text-muted-foreground">Cancelamentos no mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Inclui novas adesões e extras</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crescimento Histórico (6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ChartContainer config={{ mrr: { label: 'MRR (R$)', color: 'hsl(var(--primary))' } }}>
              <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(val) => `${val / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="mrr" fill="var(--color-mrr)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
