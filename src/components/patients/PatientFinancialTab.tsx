import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export function PatientFinancialTab({ patientId }: { patientId: string }) {
  const [records, setRecords] = useState<any[]>([])

  const loadData = async () => {
    try {
      const data = await pb.collection('financial_records').getFullList({
        filter: `patient = '${patientId}'`,
        sort: '-due_date',
      })
      setRecords(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [patientId])

  useRealtime('financial_records', () => {
    loadData()
  })

  const totalBilled = records
    .filter((r) => r.type !== 'estorno')
    .reduce((acc, r) => acc + (r.total || 0), 0)
  const totalPaid = records
    .filter((r) => r.status === 'pago')
    .reduce((acc, r) => acc + (r.total || 0), 0)
  const totalOverdue = records
    .filter((r) => r.status === 'atrasado')
    .reduce((acc, r) => acc + (r.total || 0), 0)

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Faturado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBilled)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Inadimplência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum registro financeiro encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recibo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.due_date ? new Date(r.due_date).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>{r.due_time || '-'}</TableCell>
                    <TableCell>{r.description || r.type || '-'}</TableCell>
                    <TableCell>{formatCurrency(r.total || 0)}</TableCell>
                    <TableCell>
                      <Badge
                        className="capitalize"
                        variant={
                          r.status === 'pago'
                            ? 'default'
                            : r.status === 'atrasado'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.receipt_url ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={r.receipt_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
