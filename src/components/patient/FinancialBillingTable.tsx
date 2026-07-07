import { useMemo } from 'react'
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
import { cn } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  formatTime,
  getStatusColor,
  getStatusLabel,
  groupByMonth,
  getCurrentMonthRecords,
  getNextProjectedCharges,
  monthKey,
} from '@/lib/financial-utils'

interface Props {
  records: any[]
  debtBalance: number
  onPay: (record: any) => void
}

const canPay = (s: string) => s === 'pendente' || s === 'atrasado'

export function FinancialBillingTable({ records, debtBalance, onPay }: Props) {
  const displayRecords = useMemo(() => {
    if (debtBalance > 0) {
      const debtMonths = new Set(
        records.filter((r) => canPay(r.status) && r.due_date).map((r) => monthKey(r.due_date)),
      )
      return records.filter((r) => r.due_date && debtMonths.has(monthKey(r.due_date)))
    }
    const current = getCurrentMonthRecords(records)
    const projected = getNextProjectedCharges(records, 3)
    const ids = new Set(current.map((r) => r.id))
    return [...current, ...projected.filter((r) => !ids.has(r.id))]
  }, [records, debtBalance])

  const grouped = useMemo(() => groupByMonth(displayRecords), [displayRecords])

  if (displayRecords.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-400">
          Nenhuma cobrança registrada
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {debtBalance === 0 && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-lg text-sm font-medium">
          <CheckCircle className="h-4 w-4" /> Sem débitos pendentes
        </div>
      )}
      {Object.entries(grouped).map(([month, recs]) => (
        <Card key={month}>
          <CardHeader>
            <CardTitle className="text-base">{month}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="hidden lg:table-cell">Horário</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recs.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{formatDate(r.due_date)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-gray-500">
                        {formatTime(r.due_time)}
                      </TableCell>
                      <TableCell className="text-sm">{r.description || r.type || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatCurrency(r.total)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            getStatusColor(r.status),
                          )}
                        >
                          {getStatusLabel(r.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {canPay(r.status) && (
                          <Button size="sm" onClick={() => onPay(r)}>
                            Pagar Agora
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden space-y-3">
              {recs.map((r) => (
                <div key={r.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{r.description || r.type || '-'}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(r.due_date)} {formatTime(r.due_time)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        getStatusColor(r.status),
                      )}
                    >
                      {getStatusLabel(r.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">{formatCurrency(r.total)}</span>
                    {canPay(r.status) && (
                      <Button size="sm" onClick={() => onPay(r)}>
                        Pagar Agora
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
