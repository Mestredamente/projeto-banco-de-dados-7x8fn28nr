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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function VacationsTab() {
  const [requests, setRequests] = useState<any[]>([])

  const load = async () => {
    const data = await pb
      .collection('vacation_requests')
      .getFullList({ expand: 'requester', sort: '-created' })
      .catch(() => [])
    setRequests(data)
  }

  useEffect(() => {
    load()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await pb.collection('vacation_requests').update(id, { status })
    toast.success(`Solicitação marcada como ${status}`)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 text-orange-900 p-5 rounded-xl">
        <h3 className="font-bold text-lg">Alerta de Capacidade da Clínica</h3>
        <p className="mt-1">
          A capacidade operacional geral da clínica será reduzida em <strong>15%</strong> no mês de
          Janeiro devido às férias aprovadas no sistema.
        </p>
      </div>

      <div className="bg-card p-4 rounded-xl border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Solicitações de Férias e Ausência</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profissional</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.expand?.requester?.name}</TableCell>
                <TableCell>
                  {format(new Date(r.start_date), 'dd/MM/yyyy')} até{' '}
                  {format(new Date(r.end_date), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="uppercase">
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.status === 'pendente' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateStatus(r.id, 'aprovada')}>
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(r.id, 'negada')}
                      >
                        Recusar
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  Nenhuma solicitação de férias encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
