import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Button } from '@/components/ui/button'
import { LayoutGrid, BarChart2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

export function ProductionReports({ startDate, endDate, professionalId }: any) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')

  useEffect(() => {
    async function load() {
      try {
        let filters = [`scheduled_date >= '${startDate}'`, `scheduled_date <= '${endDate}'`]
        if (professionalId && professionalId !== 'all')
          filters.push(`professional = '${professionalId}'`)

        const data = await pb.collection('appointments').getFullList({
          filter: filters.join(' && '),
          expand: 'professional',
        })
        setAppointments(data)
      } catch (err) {
        console.error(err)
        toast.error('Erro ao carregar métricas de produção')
      }
    }
    load()
  }, [startDate, endDate, professionalId])

  let morning = 0,
    afternoon = 0,
    evening = 0
  let online = 0,
    presencial = 0
  let noShow = 0,
    total = appointments.length

  appointments.forEach((a) => {
    const hour = parseInt(a.start_time?.split(':')[0] || '0')
    if (hour >= 6 && hour < 12) morning++
    else if (hour >= 12 && hour < 18) afternoon++
    else evening++

    if (a.session_type?.toLowerCase().includes('online')) online++
    else presencial++

    if (a.status === 'falta' || a.status === 'cancelado') noShow++
  })

  const noShowRate = total > 0 ? (noShow / total) * 100 : 0

  const timeData = [
    { name: 'Manhã', value: morning },
    { name: 'Tarde', value: afternoon },
    { name: 'Noite', value: evening },
  ]

  const typeData = [
    { name: 'Online', value: online },
    { name: 'Presencial', value: presencial },
  ]

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total de Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Taxa de No-show</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{noShowRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sessões Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{online}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sessões Presenciais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presencial}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mb-2">
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
          {viewMode === 'chart' ? 'Ver Tabela' : 'Ver Gráficos'}
        </Button>
      </div>

      {viewMode === 'chart' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sessões por Período do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ value: { label: 'Sessões', color: 'hsl(var(--primary))' } }}
                className="h-[250px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sessões por Modalidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ value: { label: 'Sessões', color: 'hsl(var(--secondary))' } }}
                className="h-[250px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
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
                  <TableHead>Horário</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.slice(0, 50).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {a.scheduled_date ? format(new Date(a.scheduled_date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>{a.start_time || '-'}</TableCell>
                    <TableCell>{a.expand?.professional?.name || '-'}</TableCell>
                    <TableCell>{a.session_type}</TableCell>
                    <TableCell>{a.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-2 text-xs text-center text-muted-foreground border-t">
              Exibindo os últimos 50 registros do período.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
