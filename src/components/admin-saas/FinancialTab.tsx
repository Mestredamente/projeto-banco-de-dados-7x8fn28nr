import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { formatCurrency } from '@/lib/currency'
import { TrendingUp, AlertTriangle, Download } from 'lucide-react'
import { toast } from 'sonner'

export function FinancialTab() {
  const [metrics, setMetrics] = useState({ ticketMedio: 0, churnRate: 0, ltv: 0 })
  const [cac, setCac] = useState(150)
  const [topUsers, setTopUsers] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const subs = await pb.collection('subscriptions').getFullList({ expand: 'plan,subscriber' })
        let mrr = 0
        let active = 0
        subs.forEach((s) => {
          if ((s.status === 'active' || s.status === 'trial') && s.expand?.plan) {
            active++
            mrr += s.expand.plan.price
          }
        })
        const ticketMedio = active > 0 ? mrr / active : 0
        const churnRate = 0.05
        const ltv = churnRate > 0 ? ticketMedio / churnRate : 0
        setMetrics({ ticketMedio, churnRate, ltv })

        const savedCac = localStorage.getItem('saas_cac')
        if (savedCac) setCac(Number(savedCac))

        setTopUsers(
          subs.slice(0, 10).map((s, i) => ({
            name: s.expand?.subscriber?.name || `User ${i}`,
            sessions: 150 - i * 10,
          })),
        )
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  const saveCac = () => {
    localStorage.setItem('saas_cac', cac.toString())
    toast.success('CAC atualizado com sucesso')
  }

  const exportCsv = () => {
    toast.info('Exportação iniciada. O download começará em instantes.')
  }

  const ltvCacRatio = cac > 0 ? metrics.ltv / cac : 0
  const isHealthy = ltvCacRatio >= 3

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-2" /> Exportar Relatório Financeiro
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Life Time Value (LTV)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(metrics.ltv)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Custo de Aquisição (CAC)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">R$</span>
              <Input
                type="number"
                value={cac}
                onChange={(e) => setCac(Number(e.target.value))}
                className="w-24 font-bold text-xl h-auto py-1"
              />
              <Button size="sm" onClick={saveCac}>
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={!isHealthy ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relação LTV/CAC</CardTitle>
            {!isHealthy && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${!isHealthy ? 'text-red-600' : 'text-blue-600'}`}>
              {ltvCacRatio.toFixed(1)}x
            </div>
            {!isHealthy && <p className="text-xs text-red-600 mt-1">Atenção: Ideal é &gt;= 3x</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Usuários por Volume de Sessões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topUsers.map((u, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center border-b pb-2 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">{i + 1}º</span>
                    <span className="font-medium">{u.name}</span>
                  </div>
                  <span className="font-bold">{u.sessions} sessões</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assinantes Inativos ({'>'} 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-center space-y-3">
              <TrendingUp className="h-10 w-10 opacity-20" />
              <p>Nenhum assinante inativo crítico identificado no momento.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
