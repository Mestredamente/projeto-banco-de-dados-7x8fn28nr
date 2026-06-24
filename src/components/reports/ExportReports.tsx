import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, Clock, Printer } from 'lucide-react'

export function ExportReports() {
  const [schedule, setSchedule] = useState(false)

  const handleExportPDF = () => {
    window.print()
    toast.success('Preparando PDF para impressão')
  }

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Agendamento configurado com sucesso!', {
      description: 'O relatório será enviado para o seu e-mail conforme a frequência selecionada.',
    })
  }

  return (
    <div className="space-y-6 mt-4 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Exportação Rápida</CardTitle>
          <CardDescription>
            Gere relatórios instantâneos da visualização atual da página.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex space-x-4">
          <Button onClick={handleExportPDF}>
            <Printer className="w-4 h-4 mr-2" /> Imprimir / Salvar PDF
          </Button>
          <p className="text-xs text-muted-foreground self-center">
            Utilize os botões de CSV nas abas específicas para exportar dados em formato Excel (;).
          </p>
        </CardContent>
      </Card>

      <Card>
        <form onSubmit={handleSchedule}>
          <CardHeader>
            <CardTitle>Agendar Relatórios Recorrentes</CardTitle>
            <CardDescription>
              Configure o envio automático de relatórios para o seu e-mail cadastrado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select defaultValue="financeiro">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financeiro">Fechamento Financeiro</SelectItem>
                  <SelectItem value="producao">Métricas de Produção</SelectItem>
                  <SelectItem value="compliance">Status de Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Formato do Anexo</Label>
              <RadioGroup defaultValue="pdf" className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf">PDF</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv">CSV (Excel)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t">
              <Switch id="schedule" checked={schedule} onCheckedChange={setSchedule} />
              <Label htmlFor="schedule" className="cursor-pointer">
                Ativar envio automático (Dia 1º do mês às 08:00 AM)
              </Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!schedule}>
              <Clock className="w-4 h-4 mr-2" /> Salvar Agendamento
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
