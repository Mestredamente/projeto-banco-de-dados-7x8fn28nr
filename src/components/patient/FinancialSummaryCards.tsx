import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, CalendarClock, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatCurrency,
  formatDate,
  formatTime,
  calculateDebtBalance,
  getNextCharge,
  getLast3Charges,
  getStatusColor,
  getStatusLabel,
} from '@/lib/financial-utils'

export function FinancialSummaryCards({ records }: { records: any[] }) {
  const debt = calculateDebtBalance(records)
  const next = getNextCharge(records)
  const last3 = getLast3Charges(records)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" /> Saldo Devedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('text-2xl font-bold', debt > 0 ? 'text-red-600' : 'text-green-600')}>
            {formatCurrency(debt)}
          </div>
          {debt === 0 && <p className="text-xs text-green-500 mt-1">Sem débitos</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <CalendarClock className="h-4 w-4" /> Próxima Cobrança
          </CardTitle>
        </CardHeader>
        <CardContent>
          {next ? (
            <div className="space-y-1">
              <div className="text-lg font-bold">{formatCurrency(next.total)}</div>
              <p className="text-xs text-gray-500">
                {formatDate(next.due_date)} {formatTime(next.due_time)}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {next.description || next.type || '-'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nenhuma cobrança pendente</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <History className="h-4 w-4" /> Últimas 3 Cobranças
          </CardTitle>
        </CardHeader>
        <CardContent>
          {last3.length === 0 ? (
            <p className="text-sm text-gray-400">Sem histórico</p>
          ) : (
            <div className="space-y-2">
              {last3.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="text-gray-500 shrink-0">{formatDate(r.due_date)}</span>
                  <span className="font-medium">{formatCurrency(r.total)}</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                      getStatusColor(r.status),
                    )}
                  >
                    {getStatusLabel(r.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
