import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import pb from '@/lib/pocketbase/client'
import { Badge } from '@/components/ui/badge'

export function AuditTab() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const data = await pb.collection('audit_logs').getList(1, 50, {
          sort: '-created',
          expand: 'actor',
        })
        setLogs(data.items)
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Log de Auditoria Global</h2>

      <div className="border rounded-md bg-white dark:bg-gray-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Tabela</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(log.created).toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="font-medium">
                  {log.expand?.actor?.name || log.expand?.actor?.email || 'Sistema'}
                </TableCell>
                <TableCell>
                  <Badge variant={log.action === 'delete' ? 'destructive' : 'outline'}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>{log.table_name}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {log.ip_address || 'N/A'}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  Nenhum log de auditoria encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
