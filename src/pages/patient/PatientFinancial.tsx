import { useEffect, useState } from 'react'
import { usePatient } from '@/hooks/use-patient'
import pb from '@/lib/pocketbase/client'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DollarSign, Download, Package } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'

export default function PatientFinancial() {
  const { patient, loading } = usePatient()
  const [records, setRecords] = useState<any[]>([])

  useEffect(() => {
    if (!patient) return
    pb.collection('financial_records')
      .getFullList({
        filter: `patient="${patient.id}"`,
        sort: '-due_date',
      })
      .then(setRecords)
      .catch(console.error)
  }, [patient])

  useRealtime('financial_records', () => {
    if (!patient) return
    pb.collection('financial_records')
      .getFullList({
        filter: `patient="${patient.id}"`,
        sort: '-due_date',
      })
      .then(setRecords)
      .catch(console.error)
  })

  if (loading) return <div>Carregando...</div>

  const packages = records.filter((r) => r.type === 'pacote')
  const others = records.filter((r) => r.type !== 'pacote')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-teal-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro e Recibos</h1>
          <p className="text-gray-500">Acompanhe seus pagamentos e baixe seus recibos.</p>
        </div>
      </div>

      {packages.length > 0 && (
        <Card className="bg-teal-50/50 border-teal-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-teal-800">
              <Package className="h-5 w-5" />
              Seus Pacotes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {packages.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    Pacote de Sessões -{' '}
                    {format(parseISO(p.payment_date || p.due_date), 'MMMM/yyyy')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Status do pagamento: <span className="capitalize">{p.status}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-teal-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      p.total,
                    )}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Cobranças</CardTitle>
        </CardHeader>
        <CardContent>
          {others.length === 0 ? (
            <p className="text-center py-6 text-gray-500">Nenhuma cobrança encontrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Recibo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {others.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{format(parseISO(r.due_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="capitalize">{r.type}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          r.status === 'pago'
                            ? 'bg-green-100 text-green-700'
                            : r.status === 'pendente'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {r.status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(r.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.receipt_url && r.status === 'pago' ? (
                        <Button variant="ghost" size="sm" className="text-teal-600" asChild>
                          <a href={r.receipt_url} target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4 mr-1" /> Baixar
                          </a>
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
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
