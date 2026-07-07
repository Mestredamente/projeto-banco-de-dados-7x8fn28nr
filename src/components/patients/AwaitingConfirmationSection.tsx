import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate, formatTime } from '@/lib/financial-utils'
import { PaymentConfirmDialog } from './PaymentConfirmDialog'
import { confirmPaymentByPsychologist } from '@/services/financial-records'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export function AwaitingConfirmationSection({ patientId }: { patientId: string }) {
  const [records, setRecords] = useState<any[]>([])
  const [expanded, setExpanded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [patientName, setPatientName] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [data, patient] = await Promise.all([
        pb.collection('financial_records').getFullList({
          filter: `patient = '${patientId}' && status = 'aguardando_confirmacao'`,
          sort: '-due_date',
        }),
        pb.collection('patients').getOne(patientId),
      ])
      setRecords(data)
      setPatientName(patient?.name || '')
    } catch (e) {
      console.error(e)
    }
  }, [patientId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('financial_records', () => {
    loadData()
  })

  const handleConfirm = (record: any) => {
    setSelectedRecord(record)
    setDialogOpen(true)
  }

  const onConfirm = async (recordId: string) => {
    const result = await confirmPaymentByPsychologist(recordId)
    if (result.success && !result.notification_sent) {
      toast.warning('Pagamento confirmado, mas notificação não foi enviada')
    } else if (result.success) {
      toast.success('Pagamento confirmado')
    }
    loadData()
    return result
  }

  if (records.length === 0 && !expanded) return null

  return (
    <>
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-900">
                {records.length} pagamento(s) aguardando confirmação
              </span>
            </div>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-orange-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-orange-600" />
            )}
          </button>
        </CardContent>
      </Card>

      {expanded && (
        <Card>
          <CardContent className="p-4">
            {records.length === 0 ? (
              <p className="text-center text-gray-500 py-4 text-sm">
                Nenhum pagamento aguardando confirmação
              </p>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead className="hidden lg:table-cell">Horário</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">{formatDate(r.due_date)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-gray-500">
                            {formatTime(r.due_time)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.description || r.type || '-'}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {formatCurrency(r.total)}
                          </TableCell>
                          <TableCell className="text-sm">{r.payment_method || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => handleConfirm(r)}>
                              Confirmar Pagamento
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="md:hidden space-y-3">
                  {records.map((r) => (
                    <div key={r.id} className="border rounded-lg p-4 space-y-2 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{r.description || r.type || '-'}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(r.due_date)} {formatTime(r.due_time)}
                          </p>
                        </div>
                        <span className="font-bold">{formatCurrency(r.total)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Método: {r.payment_method || '-'}
                        </span>
                        <Button size="sm" onClick={() => handleConfirm(r)}>
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <PaymentConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={selectedRecord}
        patientName={patientName}
        onConfirm={onConfirm}
      />
    </>
  )
}
