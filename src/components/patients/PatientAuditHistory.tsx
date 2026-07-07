import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { History, ChevronLeft, ChevronRight } from 'lucide-react'
import { getProfileAuditLogs, type ProfileAuditLogEntry } from '@/services/profile-audit-log'
import { getFieldLabel, formatAuditValue } from '@/lib/audit-utils'
import { format } from 'date-fns'

const PER_PAGE = 10

export function PatientAuditHistory({ patientId }: { patientId: string }) {
  const [logs, setLogs] = useState<ProfileAuditLogEntry[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!patientId) return
    setLoading(true)
    getProfileAuditLogs(patientId, page, PER_PAGE)
      .then((res) => {
        setLogs(res.items)
        setTotalPages(res.totalPages)
        setTotalItems(res.totalItems)
      })
      .catch(() => {
        setLogs([])
        setTotalPages(1)
        setTotalItems(0)
      })
      .finally(() => setLoading(false))
  }, [patientId, page])

  const authorLabel = (changedBy: string) => (changedBy === 'paciente' ? 'Paciente' : 'Psicólogo')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Histórico de Alterações do Paciente
        </CardTitle>
        <CardDescription>
          Registro completo de alterações no perfil do paciente.
          {totalItems > 0 && ` ${totalItems} registro(s) no total.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma alteração registrada para este paciente.
          </p>
        ) : (
          <>
            <ul className="space-y-3">
              {logs.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono text-muted-foreground">
                      [{format(new Date(entry.created), 'dd/MM/yyyy HH:mm')}]
                    </span>
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary">
                      {authorLabel(entry.changed_by)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Alterou{' '}
                    <span className="font-medium text-foreground">
                      {getFieldLabel(entry.field_name)}
                    </span>{' '}
                    de{' '}
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-xs text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
