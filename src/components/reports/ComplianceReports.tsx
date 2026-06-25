import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format, differenceInDays, differenceInYears } from 'date-fns'
import { AlertTriangle, ShieldCheck, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export function ComplianceReports({ startDate, endDate }: any) {
  const [pendingNotes, setPendingNotes] = useState<any[]>([])
  const [lgpdAlerts, setLgpdAlerts] = useState<any[]>([])
  const [retentionAlerts, setRetentionAlerts] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditError, setAuditError] = useState(false)
  const [crisisLogs, setCrisisLogs] = useState<any[]>([])
  const { user } = useAuth()

  useEffect(() => {
    async function load() {
      try {
        const notes = await pb.collection('session_notes').getFullList({
          filter: `status = 'rascunho'`,
          expand: 'patient,professional',
        })
        const now = new Date()
        const delayed = notes.filter((n) => differenceInDays(now, new Date(n.created)) > 7)
        setPendingNotes(delayed)

        const patients = await pb.collection('patients').getFullList()
        const lgpd = patients.filter(
          (p) => !p.consent_given_at || differenceInYears(now, new Date(p.consent_given_at)) >= 1,
        )
        setLgpdAlerts(lgpd)

        const retention = patients.filter((p) => differenceInYears(now, new Date(p.created)) >= 5)
        setRetentionAlerts(retention)

        const crises = await pb.collection('session_notes').getFullList({
          filter: `evolution_type = 'Intervenção em crise' && created >= '${startDate}' && created <= '${endDate}'`,
          expand: 'patient,professional',
          sort: '-created',
        })
        setCrisisLogs(crises)

        try {
          const logs = await pb.collection('audit_logs').getFullList({
            filter: `(action = 'Visualizou prontuário' || action = 'view') && table_name = 'patients' && created >= '${startDate}' && created <= '${endDate}'`,
            expand: 'actor',
            sort: '-created',
          })
          setAuditLogs(logs)
          setAuditError(false)
        } catch (err) {
          console.error('Audit logs error:', err)
          setAuditError(true)
          setAuditLogs([])
        }
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [startDate, endDate])

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-x-2 pb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-md">Evoluções Pendentes ({'>'} 7 dias)</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-auto">
            {pendingNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma evolução pendente encontrada.</p>
            ) : (
              <div className="space-y-3">
                {pendingNotes.map((n) => (
                  <div key={n.id} className="text-sm border-b pb-2">
                    <div className="font-medium">{n.expand?.patient?.name || 'Desconhecido'}</div>
                    <div className="text-xs text-muted-foreground">
                      Profissional: {n.expand?.professional?.name} |{' '}
                      {differenceInDays(new Date(), new Date(n.created))} dias de atraso
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-x-2 pb-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-md">Avisos LGPD e Retenção</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-auto space-y-4">
            <div>
              <h4 className="text-sm font-bold text-muted-foreground mb-2">
                Consentimento Ausente/Expirado
              </h4>
              {lgpdAlerts.length === 0 ? (
                <p className="text-xs">Tudo ok.</p>
              ) : (
                lgpdAlerts.slice(0, 5).map((p) => (
                  <div key={p.id} className="text-xs mb-1">
                    • {p.name}
                  </div>
                ))
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-muted-foreground mb-2">
                Limite de Retenção ({'>'} 5 anos)
              </h4>
              {retentionAlerts.length === 0 ? (
                <p className="text-xs">Tudo ok.</p>
              ) : (
                retentionAlerts.slice(0, 5).map((p) => (
                  <div key={p.id} className="text-xs mb-1">
                    • {p.name}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-md text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Relatório de Crises
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Ação / Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crisisLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-xs">
                    Nenhum evento de crise registrado no período.
                  </TableCell>
                </TableRow>
              ) : (
                crisisLogs.map((log) => {
                  const isOwn = log.professional === user?.id
                  const isAdmin = ['gestor_saas', 'admin_clinica'].includes(user?.role || '')
                  const anonymize = isAdmin && !isOwn
                  const patientName = anonymize
                    ? `ID: ${log.expand?.patient?.id.substring(0, 5)}***`
                    : log.expand?.patient?.name
                  const actionText = anonymize
                    ? 'Detalhes preservados (Sigilo Profissional)'
                    : log.content

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.created), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium text-xs">{patientName}</TableCell>
                      <TableCell className="text-xs">{log.expand?.professional?.name}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate" title={log.content}>
                        {actionText}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-md">Logs de Acesso a Prontuários</CardTitle>
            {auditError && (
              <p className="text-xs text-muted-foreground text-amber-600 mt-1">
                Erro ao carregar logs reais.
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (auditLogs.length === 0) return
              const headers = ['Data/Hora', 'Usuário', 'Paciente', 'Ação']
              const rows = auditLogs.map((log) => [
                format(new Date(log.created), 'dd/MM/yyyy HH:mm'),
                log.expand?.actor?.name || log.new_data?.actor_name || 'Sistema',
                log.new_data?.patient_name || log.record_id,
                log.action,
              ])
              const csvContent = [
                headers.join(','),
                ...rows.map((e) => e.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(',')),
              ].join('\n')

              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.setAttribute('href', url)
              link.setAttribute(
                'download',
                `auditoria_acessos_${format(new Date(), 'yyyy-MM-dd')}.csv`,
              )
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-sm">
                    Nenhum log de acesso no período selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.created), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>
                      {log.expand?.actor?.name || log.new_data?.actor_name || 'Sistema'}
                    </TableCell>
                    <TableCell>
                      {log.new_data?.patient_name || (
                        <span className="font-mono text-xs">{log.record_id}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
