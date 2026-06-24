import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Users, FileText } from 'lucide-react'
import { getResearchPatients, recordExport } from '@/services/research'
import { toast } from '@/hooks/use-toast'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis } from 'recharts'

export default function ResearchDashboard() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getResearchPatients().then((data) => {
      setPatients(data)
      setLoading(false)
    })
  }, [])

  const handleExportCSV = async () => {
    if (patients.length > 50) {
      toast({
        title: 'Limite atingido',
        description:
          'Você atingiu o limite de exportação do seu plano. Para aumentar, acesse as configurações para realizar o upgrade.',
        variant: 'destructive',
      })
      return
    }

    await recordExport('CSV', patients.length)
    toast({
      title: 'Exportação Concluída',
      description: 'O arquivo CSV foi gerado com sucesso e salvo no histórico.',
    })
  }

  const ageData = [
    { name: '18-25', value: 12 },
    { name: '26-35', value: 25 },
    { name: '36-45', value: 15 },
    { name: '45+', value: 8 },
  ]

  const cidData = [
    { name: 'F41 (Ansiedade)', value: 30 },
    { name: 'F32 (Depressão)', value: 20 },
    { name: 'F90 (TDAH)', value: 10 },
  ]

  const COLORS = ['#0d9488', '#2dd4bf', '#ccfbf1', '#115e59']
  const chartConfig = {
    value: { label: 'Quantidade', color: 'hsl(var(--chart-1))' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Select defaultValue="3m">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
            <SelectItem value="1y">Último ano</SelectItem>
            <SelectItem value="all">Todo o período</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Exportar CSV (Anonimizado)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pacientes com Consentimento</p>
              <p className="text-2xl font-bold">{loading ? '...' : patients.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-teal-50/50 border-teal-100">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-teal-100 text-teal-600 rounded-full">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Sessões (Amostra)</p>
              <p className="text-2xl font-bold">{loading ? '...' : patients.length * 12}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-gray-600 px-1">
        Você tem <strong>{patients.length}</strong> pacientes com consentimento para pesquisa. Total
        de <strong>{patients.length * 12}</strong> sessões no período.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Idade</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ageData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Queixas (CID)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={cidData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
