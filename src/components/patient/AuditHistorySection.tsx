import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { History } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getRecentProfileAuditLogs, type ProfileAuditLogEntry } from '@/services/profile-audit-log'
import { useRealtime } from '@/hooks/use-realtime'
import { getFieldLabel, formatAuditValue } from '@/lib/audit-utils'
import { format } from 'date-fns'

export function AuditHistorySection({ patientId }: { patientId: string }) {
  const [logs, setLogs] = useState<ProfileAuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadLogs = useCallback(async () => {
    if (!patientId) return
    try {
      const res = await getRecentProfileAuditLogs(patientId, 10)
      setLogs(res.items)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  useRealtime(
    'profile_audit_log',
    () => {
      loadLogs()
    },
    !!patientId,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Histórico de Alterações
        </CardTitle>
        <CardDescription>Últimas 10 alterações realizadas no seu perfil.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma alteração registrada ainda.
          </p>
        ) : (
          <ul className="space-y-3">
            {logs.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">
                    [{format(new Date(entry.created), 'dd/MM/yyyy HH:mm')}]
                  </span>
                  <span className="font-medium text-foreground">
                    {getFieldLabel(entry.field_name)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Alterado de{' '}
                  <span className="font-medium text-foreground">
                    {formatAuditValue(entry.field_name, entry.old_value)}
                  </span>{' '}
                  para{' '}
                  <span className="font-medium text-foreground">
                    {formatAuditValue(entry.field_name, entry.new_value)}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
