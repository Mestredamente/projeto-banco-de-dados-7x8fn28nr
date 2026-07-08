import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, TrendingUp } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/currency'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/system/ErrorState'
import { EmptyState } from '@/components/system/EmptyState'
import { useRealtime } from '@/hooks/use-realtime'
import { useManagerFilter } from '@/hooks/use-manager-filter'

export function FinancialReports() {
  const [data, setData] = useState<any[]>([])
  const [topPatients, setTopPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isSaaSAdmin, clinicIds } = useManagerFilter()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let filter: string | undefined
      if (!isSaaSAdmin) {
        if (clinicIds.length === 0) {
          setData([])
          setTopPatients([])
          return
        }
        filter = clinicIds.map((id) => `clinic="${id}"`).join(' || ')
      }

      const records = await pb.collection('financial_records').getFullList({
        filter,
        expand: 'patient',
      })

      const monthly = records.reduce((acc: Record<string, any>, curr: any) => {
        if (!curr.due_date) return acc
        const month = curr.due_date.substring(0, 7)
        if (!acc[month]) acc[month] = { month, recebido: 0, pendente: 0, atrasado: 0 }
        if (curr.status === 'pago') acc[month].recebido += curr.total || 0
        else if (curr.status === 'pendente') acc[month].pendente += curr.total || 0
        else if (curr.status === 'atrasado') acc[month].atrasado += curr.total || 0
        return acc
      }, {})

      const arr = Object.values(monthly).sort((a: any, b: any) => a.month.localeCompare(b.month))
      setData(arr)

      const patientRevenue: Record<string, { name: string; total: number }> = {}
      records.forEach((r: any) => {
        if (r.status !== 'pago') return
        const patientId = r.patient || r.id
        const patientName = r.expand?.patient?.name || 'Sem nome'
        if (!patientRevenue[patientId]) {
          patientRevenue[patientId] = { name: patientName, total: 0 }
        }
        patientRevenue[patientId].total += r.total || 0
      })
      const top = Object.values(patientRevenue)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
      setTopPatients(top)
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar os relatórios financeiros.')
    } finally {
      setLoading(false)
    }
  }, [isSaaSAdmin, clinicIds])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('financial_records', () => {
    loadData()
  })

  const exportCSV = () => {
    try {
      const csvContent =
        'data:text/csv;charset=utf-8,Mes,Recebido,Pendente,Atrasado\n' +
        data.map((e) => `${e.month},${e.recebido},${e.pendente},${e.atrasado}`).join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', 'relatorio_financeiro.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-[380px] md:col-span-2" />
          <Skeleton className="h-[380px]" />
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorState title="Erro de Carregamento" message={error} onRetry={loadData} />
  }

  if (data.length === 0 && topPatients.length === 0) {
    return (
      <EmptyState
        context="relatorios"
        title="Nenhum relatório disponível"
        description="Ainda não há dados financeiros suficientes para gerar relatórios."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Relatórios Financeiros</h2>
          <p className="text-muted-foreground text-sm">
            Visualização de fluxo de caixa e sazonalidade.
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={data.length === 0}>
          <Download className="w-4 h-4 mr-2" /> Exportar Contabilidade
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Sazonalidade e Inadimplência</CardTitle>
            <CardDescription>Receitas e valores atrasados por mês.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.length > 0 ? (
              <ChartContainer
                config={{
                  recebido: { label: 'Recebido (R$)', color: 'hsl(var(--primary))' },
                  atrasado: { label: 'Atrasado (R$)', color: 'hsl(var(--destructive))' },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(val) => `R$ ${val}`} width={80} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="recebido" fill="var(--color-recebido)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="atrasado" fill="var(--color-atrasado)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados de fluxo de caixa disponíveis.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" /> Top Pacientes
            </CardTitle>
            <CardDescription>Maiores fontes de receita</CardDescription>
          </CardHeader>
          <CardContent>
            {topPatients.length > 0 ? (
              <div className="space-y-4 mt-2">
                {topPatients.map((patient, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center border-b pb-2 last:border-0"
                  >
                    <span className="font-medium text-sm">
                      {idx + 1}. {patient.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(patient.total)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhum paciente com receita registrada.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
