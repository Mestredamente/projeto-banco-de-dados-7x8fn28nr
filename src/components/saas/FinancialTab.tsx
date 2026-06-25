import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/currency'
import { AlertTriangle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FinancialTab() {
  const [cac, setCac] = useState(150)
  const ticketMedio = 150
  const churnRate = 0.025
  const ltv = ticketMedio / churnRate
  const ltvCacRatio = ltv / cac

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Saúde Financeira do SaaS</h2>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" /> Exportar CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ticket Médio Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(ticketMedio)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Life Time Value (LTV)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(ltv)}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimativa (Ticket / Churn)</p>
          </CardContent>
        </Card>
        <Card className={ltvCacRatio < 3 ? 'border-red-500 bg-red-50' : 'bg-green-50'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Relação LTV / CAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${ltvCacRatio < 3 ? 'text-red-600' : 'text-green-600'}`}
            >
              {ltvCacRatio.toFixed(1)}x
            </div>
            {ltvCacRatio < 3 && (
              <p className="text-xs text-red-500 flex items-center mt-2 font-medium">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Alerta: Ideal {'>'} 3x para sustentabilidade
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Configuração de Métricas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Custo de Aquisição de Clientes (CAC) - R$</Label>
            <Input type="number" value={cac} onChange={(e) => setCac(Number(e.target.value))} />
          </div>
          <p className="text-sm text-gray-500">
            O valor inserido acima atualizará automaticamente o indicador LTV/CAC em tempo real.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
