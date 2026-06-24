import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'

export function CycleBillingModal({ open, onOpenChange }: any) {
  const [loading, setLoading] = useState(false)
  const summary = {
    patient: 'João Silva',
    period: 'Junho/2026',
    count: 4,
    total: 600,
  }

  const handleGenerate = async () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Cobrança de ciclo gerada com sucesso!')
      onOpenChange(false)
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fechamento de Ciclo (Mensal)</DialogTitle>
          <DialogDescription>
            Agrupa múltiplas sessões em uma única cobrança consolidada.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2 bg-slate-50 dark:bg-slate-900 p-4 rounded-md mt-2">
          <p>
            <strong>Paciente:</strong> {summary.patient}
          </p>
          <p>
            <strong>Período:</strong> {summary.period}
          </p>
          <p>
            <strong>Sessões agrupadas:</strong> {summary.count}
          </p>
          <p className="pt-2 border-t mt-2">
            <strong>Valor Total do Ciclo:</strong>{' '}
            <span className="text-xl font-bold text-blue-600 ml-2">
              {formatCurrency(summary.total)}
            </span>
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            Gerar Cobrança Única
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
