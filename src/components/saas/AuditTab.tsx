import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function AuditTab() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    pb.collection('audit_logs')
      .getList(1, 20, { sort: '-created', expand: 'actor' })
      .then((res) => setLogs(res.items))
      .catch(console.error)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Log de Auditoria Global</h2>
        <span className="text-sm text-gray-500">Últimos 20 registros críticos</span>
      </div>
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Data e Hora</TableHead>
              <TableHead>Ação Executada</TableHead>
              <TableHead>Tabela Afetada</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Endereço IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-gray-500">
                  {new Date(log.created).toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="font-medium text-slate-900">{log.action}</TableCell>
                <TableCell className="text-sm">
                  <code className="bg-slate-100 px-1 py-0.5 rounded">{log.table_name}</code>
                </TableCell>
                <TableCell className="text-sm">{log.expand?.actor?.name || log.actor}</TableCell>
                <TableCell className="text-sm font-mono text-gray-500">{log.ip_address}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                  Nenhum log de auditoria recente no sistema.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
