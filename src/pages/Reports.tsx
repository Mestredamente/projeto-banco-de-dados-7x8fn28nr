import { useState, useEffect, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
} from 'date-fns'
import { ClinicalReports } from '@/components/reports/ClinicalReports'
import { FinancialReportsTab } from '@/components/reports/FinancialReportsTab'
import { ProductionReports } from '@/components/reports/ProductionReports'
import { ComplianceReports } from '@/components/reports/ComplianceReports'
import { ExportReports } from '@/components/reports/ExportReports'
import pb from '@/lib/pocketbase/client'
import { Label } from '@/components/ui/label'

export type DateRangeType = 'hoje' | 'semana' | 'mes' | '3meses' | 'ano'

export default function Reports() {
  const { user } = useAuth()
  const isSecretary = user?.role === 'secretaria'

  const [period, setPeriod] = useState<DateRangeType>('mes')
  const [patientId, setPatientId] = useState<string>('all')
  const [professionalId, setProfessionalId] = useState<string>('all')

  const [patients, setPatients] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])

  const dateBounds = useMemo(() => {
    const now = new Date()
    switch (period) {
      case 'hoje':
        return { start: startOfDay(now), end: endOfDay(now) }
      case 'semana':
        return { start: startOfWeek(now), end: endOfWeek(now) }
      case 'mes':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case '3meses':
        return { start: startOfMonth(subMonths(now, 3)), end: endOfMonth(now) }
      case 'ano':
        return { start: startOfYear(now), end: endOfYear(now) }
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) }
    }
  }, [period])

  const startDateStr = dateBounds.start.toISOString()
  const endDateStr = dateBounds.end.toISOString()

  useEffect(() => {
    async function loadOptions() {
      try {
        const [pts, profs] = await Promise.all([
          pb.collection('patients').getFullList({ sort: 'name' }),
          pb.collection('users').getFullList({ filter: `role != 'paciente'`, sort: 'name' }),
        ])
        setPatients(pts)
        setProfessionals(profs)
      } catch (err) {
        console.error('Error loading filters', err)
      }
    }
    loadOptions()
  }, [])

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8">
      <div className="flex flex-col justify-between items-start gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Central de Relatórios</h1>
        <p className="text-muted-foreground">
          Acompanhe métricas clínicas, financeiras e de produção na sua clínica.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-lg border">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Período</Label>
          <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="3meses">Últimos 3 Meses</SelectItem>
              <SelectItem value="ano">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Paciente</Label>
          <Select value={patientId} onValueChange={setPatientId}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os pacientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Pacientes</SelectItem>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isSecretary && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Profissional</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os profissionais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Profissionais</SelectItem>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Tabs defaultValue={isSecretary ? 'producao' : 'clinico'} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent border-b rounded-none mb-6">
          {!isSecretary && (
            <TabsTrigger
              value="clinico"
              className="data-[state=active]:bg-muted/50 rounded-t-md rounded-b-none border-b-2 data-[state=active]:border-primary border-transparent"
            >
              Clínico
            </TabsTrigger>
          )}
          {!isSecretary && (
            <TabsTrigger
              value="financeiro"
              className="data-[state=active]:bg-muted/50 rounded-t-md rounded-b-none border-b-2 data-[state=active]:border-primary border-transparent"
            >
              Financeiro
            </TabsTrigger>
          )}
          <TabsTrigger
            value="producao"
            className="data-[state=active]:bg-muted/50 rounded-t-md rounded-b-none border-b-2 data-[state=active]:border-primary border-transparent"
          >
            Produção
          </TabsTrigger>
          {!isSecretary && (
            <TabsTrigger
              value="compliance"
              className="data-[state=active]:bg-muted/50 rounded-t-md rounded-b-none border-b-2 data-[state=active]:border-primary border-transparent"
            >
              Compliance
            </TabsTrigger>
          )}
          <TabsTrigger
            value="exportacao"
            className="data-[state=active]:bg-muted/50 rounded-t-md rounded-b-none border-b-2 data-[state=active]:border-primary border-transparent"
          >
            Exportação
          </TabsTrigger>
        </TabsList>

        {!isSecretary && (
          <TabsContent value="clinico">
            <ClinicalReports startDate={startDateStr} endDate={endDateStr} patientId={patientId} />
          </TabsContent>
        )}

        {!isSecretary && (
          <TabsContent value="financeiro">
            <FinancialReportsTab
              startDate={startDateStr}
              endDate={endDateStr}
              professionalId={professionalId}
              patientId={patientId}
            />
          </TabsContent>
        )}

        <TabsContent value="producao">
          <ProductionReports
            startDate={startDateStr}
            endDate={endDateStr}
            professionalId={professionalId}
          />
        </TabsContent>

        {!isSecretary && (
          <TabsContent value="compliance">
            <ComplianceReports startDate={startDateStr} endDate={endDateStr} />
          </TabsContent>
        )}

        <TabsContent value="exportacao">
          <ExportReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}
