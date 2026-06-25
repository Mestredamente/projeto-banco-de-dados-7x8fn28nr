import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/system/Skeleton'
import { ErrorState } from '@/components/system/ErrorState'
import { EmptyState } from '@/components/system/EmptyState'
import { BarChart2 } from 'lucide-react'

export function AnalyticsTab() {
  const [data, setData] = useState<{ month: string; mrr: number; subs: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        let subs: any[] = []
        try {
          subs = await pb.collection('subscriptions').getFullList({ expand: 'plan' })
        } catch (e) {
          console.warn("Coleção 'subscriptions' indisponível:", e)
          throw new Error('Indisponível')
        }

        if (!isMounted) return

        const history = []
        for (let i = 11; i >= 0; i--) {
          const d = new Date()
          d.setMonth(d.getMonth() - i)
          const month = d.toLocaleString('pt-BR', { month: 'short' })
          const year = d.getFullYear()
          const endOfMonth = new Date(year, d.getMonth() + 1, 0, 23, 59, 59)

          const activeInMonth = subs.filter((s) => {
            const created = new Date(s.created)
            if (created > endOfMonth) return false
            if (s.status === 'canceled' && s.canceled_at) {
              const canceled = new Date(s.canceled_at)
              if (canceled < new Date(year, d.getMonth(), 1)) return false
            }
            return true
          })

          const mrr = activeInMonth.reduce((acc, s) => acc + (s.expand?.plan?.price || 0), 0)
          history.push({
            month: `${month.charAt(0).toUpperCase() + month.slice(1)}/${year.toString().slice(-2)}`,
            subs: activeInMonth.length,
            mrr,
          })
        }

        setData(history)
      } catch (err: any) {
        if (isMounted) setError(err.message === 'Indisponível' ? 'Indisponível' : 'Erro interno')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  if (error) {
    return (
      <ErrorState
        title={error === 'Indisponível' ? 'Indisponível' : 'Erro de Carregamento'}
        message={
          error === 'Indisponível'
            ? 'Os dados necessários para os gráficos não estão disponíveis.'
            : 'Não foi possível carregar as tendências históricas.'
        }
      />
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const hasData = data.some((d) => d.subs > 0 || d.mrr > 0)

  if (!hasData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            illustration={
              <div className="relative flex items-center justify-center w-[120px] h-[120px] rounded-full bg-primary/10 mb-6">
                <BarChart2 className="w-16 h-16 text-primary" strokeWidth={1.5} />
              </div>
            }
            title="Ainda não há dados suficientes para exibir tendências."
            description="As métricas de crescimento e receita aparecerão aqui assim que houver histórico de assinaturas."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crescimento Histórico (12 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ChartContainer
              config={{
                mrr: { label: 'MRR (R$)', color: 'hsl(var(--primary))' },
                subs: { label: 'Assinantes', color: 'hsl(var(--secondary))' },
              }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(val) => `R$ ${val >= 1000 ? val / 1000 + 'k' : val}`}
                  />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    yAxisId="left"
                    dataKey="mrr"
                    fill="var(--color-mrr)"
                    radius={[4, 4, 0, 0]}
                    name="MRR (R$)"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="subs"
                    fill="var(--color-subs)"
                    radius={[4, 4, 0, 0]}
                    name="Assinantes"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
