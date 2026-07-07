import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Copy, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate, formatTime } from '@/lib/financial-utils'

interface PaymentConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: any | null
  acceptedMethods: string[]
  pixKey: string
  onConfirm: (recordId: string, method: string) => Promise<void>
}

export function PaymentConfirmModal({
  open,
  onOpenChange,
  record,
  acceptedMethods,
  pixKey,
  onConfirm,
}: PaymentConfirmModalProps) {
  const [method, setMethod] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setMethod('')
  }, [open])

  const handleConfirm = async () => {
    if (!record || !method) return
    setLoading(true)
    try {
      await onConfirm(record.id, method)
      toast.success('Pagamento registrado. Aguardando confirmação do psicólogo.')
      onOpenChange(false)
    } catch {
      toast.error('Erro ao registrar pagamento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey)
    toast.success('Chave PIX copiada!')
  }

  if (!record) return null

  const hasMethods = Array.isArray(acceptedMethods) && acceptedMethods.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Confirmar Pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Data:</span>
              <span className="font-medium">
                {formatDate(record.due_date)} {formatTime(record.due_time)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Descrição:</span>
              <span className="font-medium">{record.description || record.type || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Valor:</span>
              <span className="font-bold text-teal-700">{formatCurrency(record.total)}</span>
            </div>
          </div>

          {!hasMethods ? (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Configure seus métodos de pagamento nas preferências
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Método de Pagamento</label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {acceptedMethods.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {method === 'PIX' &&
                (pixKey ? (
                  <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 space-y-2">
                    <p className="text-sm text-teal-800 font-medium">Chave PIX:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-teal-100 truncate">
                        {pixKey}
                      </code>
                      <Button size="sm" variant="outline" onClick={copyPixKey}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Psicólogo não configurou chave PIX
                  </div>
                ))}

              {method === 'Dinheiro' && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                  Confirme o pagamento em dinheiro com o psicólogo
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !method || !hasMethods}>
            {loading ? 'Confirmando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
