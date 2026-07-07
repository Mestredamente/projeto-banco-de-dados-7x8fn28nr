import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { formatCurrency, formatDate, formatTime } from '@/lib/financial-utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: any | null
  patientName: string
  onConfirm: (recordId: string) => Promise<void>
}

export function ConfirmPaymentModal({ open, onOpenChange, record, patientName, onConfirm }: Props) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!record) return
    setLoading(true)
    try {
      await onConfirm(record.id)
      onOpenChange(false)
    } catch {
      /* intentionally ignored */
    } finally {
      setLoading(false)
    }
  }

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Confirmar Pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Paciente:</span>
              <span className="font-medium">{patientName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Data:</span>
              <span className="font-medium">{formatDate(record.due_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Horário:</span>
              <span className="font-medium">{formatTime(record.due_time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Descrição:</span>
              <span className="font-medium">{record.description || record.type || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Valor:</span>
              <span className="font-bold text-teal-700">{formatCurrency(record.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Método de pagamento:</span>
              <span className="font-medium">{record.payment_method || '-'}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirmando...
              </>
            ) : (
              'Confirmar Pagamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
