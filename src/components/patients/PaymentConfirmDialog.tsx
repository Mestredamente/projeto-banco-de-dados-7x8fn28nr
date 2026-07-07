import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatCurrency, formatDate, formatTime } from '@/lib/financial-utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: any | null
  patientName: string
  onConfirm: (recordId: string) => Promise<{ success: boolean; notification_sent: boolean }>
}

export function PaymentConfirmDialog({
  open,
  onOpenChange,
  record,
  patientName,
  onConfirm,
}: Props) {
  const [loading, setLoading] = useState(false)

  if (!record) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const result = await onConfirm(record.id)
      if (result.success && !result.notification_sent) {
        toast.warning('Pagamento confirmado, mas notificação não foi enviada')
      } else if (result.success) {
        toast.success('Pagamento confirmado')
      }
      onOpenChange(false)
    } catch {
      toast.error('Erro ao confirmar pagamento. Tente novamente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Confirmar Pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
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
            <div className="flex justify-between">
              <span className="text-gray-500">Paciente:</span>
              <span className="font-medium">{patientName || '-'}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Confirmando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
