import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/currency'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download, LayoutGrid, BarChart2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function FinancialReportsTab({ startDate, endDate, professionalId, patientId }: any) {
  const { user } = useAuth()
  const [records, setRecords] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')

  useEffect(() => {
    async function fetchFinancial() {
      try {
        let filters = [`payment_date >= '${startDate}'`, `payment_date <= '${endDate}'`]
        if (professionalId !== 'all') filters.push(`professional = '${professionalId}'`)
        if (patientId !== 'all') filters.push(`patient = '${patientId}'`)

        let data = await pb.collection('financial_records').getFullList({
          filter: filters.join(' && '),
          expand: 'patient,professional',
        })

        if (user?.role === 'admin_clinica') {
          const cp = await pb.collection('clinic_professionals').getFullList()
          const aluguel = cp
            .filter((c) => c.relationship_model === 'aluguel_sala')
            .map((c) => c.professional)
          data = data.filter((d) => !aluguel.includes(d.professional))
        }
        setRecords(data)
      } catch (err) {
        console.error(err)
        toast.error('Erro ao carregar dados financeiros')
      }
    }
    fetchFinancial()
  }, [startDate, endDate, professionalId, patientId, user])

  const revenue = records.filter((r) => r.status === 'pago').reduce((acc, r) => acc + r.total, 0)
  const defaults = records
    .filter((r) => r.status === 'atrasado')
    .reduce((acc, r) => acc + r.total, 0)

  const sessoes = records.filter((r) => r.type === 'sessao' && r.status === 'pago')
  const ticketMedio = sessoes.length > 0 ? revenue / sessoes.length : 0

  const pacotes = records.filter((r) => r.type === 'pacote').length
  const totalPagos = records.filter((r) => r.status === 'pago').length
  const conversionRate = totalPagos > 0 ? (pacotes / totalPagos) * 100 : 0

  const monthlyData: Record<string, { month: string; recebido: number; atrasado: number }> = {}
  records.forEach((r) => {
    if (!r.payment_date) return
    const m = format(new Date(r.payment_date), 'MMM/yy', { locale: ptBR })
    if (!monthlyData[m]) monthlyData[m] = { month: m, recebido: 0, atrasado: 0 }
    if (r.status === 'pago') monthlyData[m].recebido += r.total
    if (r.status === 'atrasado') monthlyData[m].atrasado += r.total
  })
  const chartData = Object.values(monthlyData)

  const patientRev: Record<string, { name: string; total: number }> = {}
  records
    .filter((r) => r.status === 'pago')
    .forEach((r) => {
      const name = r.expand?.patient?.name || 'Desconhecido'
      if (!patientRev[name]) patientRev[name] = { name, total: 0 }
      patientRev[name].total += r.total
    })
  const topPatients = Object.values(patientRev)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const exportCSV = () => {
    const lines = ['Data;Tipo;Valor;Status;Paciente;Profissional']
    records.forEach((r) => {
      lines.push(
        `${r.payment_date ? format(new Date(r.payment_date), 'dd/MM/yyyy') : '-'};${r.type};${r.total.toString().replace('.', ',')};${r.status};${r.expand?.patient?.name || '-'};${r.expand?.professional?.name || '-'}`,
      )
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_contador_${format(new Date(), 'yyyyMMdd')}.csv`
    link.click()
  }

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fluxo de Caixa (Recebido)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(revenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Inadimplência (Atrasado)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(defaults)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ticket Médio (Sessões Pagas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(ticketMedio)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Conv./Pacotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Análise Financeira</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
          >
            {viewMode === 'chart' ? (
              <LayoutGrid className="w-4 h-4 mr-2" />
            ) : (
              <BarChart2 className="w-4 h-4 mr-2" />
            )}
            {viewMode === 'chart' ? 'Ver Tabela' : 'Ver Gráfico'}
          </Button>
          <Button size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" /> Relatório para Contador
          </Button>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Sazonalidade do Período (Mensal)</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ChartContainer
                  config={{
                    recebido: { label: 'Recebido (R$)', color: 'hsl(var(--primary))' },
                    atrasado: { label: 'Atrasado (R$)', color: 'hsl(var(--destructive))' },
                  }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
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
                <p className="text-muted-foreground text-sm text-center py-10">
                  Dados insuficientes para o gráfico.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top 5 Pacientes (Receita)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPatients.map((p, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center border-b pb-2 last:border-0"
                  >
                    <span className="text-sm font-medium">
                      {i + 1}. {p.name}
                    </span>
                    <span className="text-sm text-muted-foreground">{formatCurrency(p.total)}</span>
                  </div>
                ))}
                {topPatients.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhum dado.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.payment_date ? format(new Date(r.payment_date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>{r.expand?.patient?.name || '-'}</TableCell>
                    <TableCell className="capitalize">{r.type}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(r.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
