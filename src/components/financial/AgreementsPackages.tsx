import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/currency'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, PackageOpen } from 'lucide-react'

export function AgreementsPackages() {
  return (
    <Tabs defaultValue="agreements" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="agreements">Acordos de Parcelamento</TabsTrigger>
        <TabsTrigger value="packages">Pacotes Pré-Pagos</TabsTrigger>
      </TabsList>

      <TabsContent value="agreements" className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Acordos Ativos de Renegociação</h2>
            <p className="text-sm text-muted-foreground">
              Regra automática: Quebra de acordo após 2 parcelas consecutivas não pagas.
            </p>
          </div>
          <Button>Novo Acordo</Button>
        </div>
        <div className="grid gap-3 mt-4">
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg">João Silva</p>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                    Em dia
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Total: {formatCurrency(1200)} • 4 parcelas de {formatCurrency(300)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Iniciado em: 01/06/2026</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Parcela 1/4 paga</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Ver Parcelas
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/30">
            <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg">Maria Souza</p>
                  <Badge variant="destructive">Em Risco</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Total: {formatCurrency(800)} • 2 parcelas de {formatCurrency(400)}
                </p>
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" /> 1 parcela em atraso. Quebra iminente.
                </p>
              </div>
              <div className="text-right">
                <Button variant="destructive" size="sm" className="mt-2">
                  Notificar Paciente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="packages" className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Gestão de Pacotes de Sessões</h2>
            <p className="text-sm text-muted-foreground">
              O saldo de sessões é deduzido automaticamente ao realizar a sessão na agenda.
            </p>
          </div>
          <Button>Vender Novo Pacote</Button>
        </div>
        <div className="grid gap-3 mt-4">
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-teal-100 p-3 rounded-md">
                  <PackageOpen className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="font-bold text-lg">Carlos Santos</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pacote: 8 Sessões • Valor: {formatCurrency(600)} (Pago)
                  </p>
                  <p className="text-sm font-medium text-blue-600 mt-1">
                    Saldo restante: 5 sessões
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Histórico de Uso
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
