import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, AlertCircle, Clock, TrendingUp } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { formatCurrency } from '@/lib/currency'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtime } from '@/hooks/use-realtime'

export function FinancialDashboard() {
  const [metrics, setMetrics] = useState({ pending: 0, received: 0, delinquent: 0, projected: 0 })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const [records, appointments] = await Promise.all([
        pb.collection('financial_records').getFullList(),
        pb.collection('appointments').getFullList({
          filter: `scheduled_date >= '${startOfMonth}' && (status = 'agendado' || status = 'confirmado_paciente')`,
        }),
      ])

      let pending = 0,
        received = 0,
        delinquent = 0,
        projected = 0

      records.forEach((r) => {
        if (r.status === 'pendente') pending += r.total || 0
        if (r.status === 'pago' && r.payment_date && r.payment_date >= startOfMonth)
          received += r.total || 0
        if (r.status === 'atrasado' && r.due_date && r.due_date < thirtyDaysAgo)
          delinquent += r.total || 0
      })

      appointments.forEach((a) => {
        projected += a.session_value || 0
      })

      setMetrics({ pending, received, delinquent, projected })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('financial_records', () => {
    loadData()
  })

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo a receber</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.pending)}</div>
          <p className="text-xs text-muted-foreground">Valores pendentes gerais</p>
        </CardContent>
      </Card>
      <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recebido no mês</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(metrics.received)}
          </div>
          <p className="text-xs text-muted-foreground">No mês atual</p>
        </CardContent>
      </Card>
      <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer border-red-100 dark:border-red-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inadimplência total</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(metrics.delinquent)}
          </div>
          <p className="text-xs text-muted-foreground">Atrasos {'>'} 30 dias</p>
        </CardContent>
      </Card>
      <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projeção de recebimento</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(metrics.projected)}
          </div>
          <p className="text-xs text-muted-foreground">Sessões agendadas no mês</p>
        </CardContent>
      </Card>
    </div>
  )
}
