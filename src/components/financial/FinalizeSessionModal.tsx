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
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/currency'

export function FinalizeSessionModal({ open, onOpenChange, appointment, onSuccess }: any) {
  const [loading, setLoading] = useState(false)

  if (!appointment) return null

  const handleAction = async (chargeNow: boolean) => {
    setLoading(true)
    try {
      // Mark session as realized
      await pb.collection('appointments').update(appointment.id, { status: 'realizado' })

      if (chargeNow) {
        // Create pending charge directly
        await pb.collection('financial_records').create({
          patient: appointment.patient,
          professional: appointment.professional,
          clinic: appointment.clinic,
          appointment: appointment.id,
          type: 'sessao',
          total: appointment.session_value || 0,
          status: 'pendente',
          due_date: new Date().toISOString(),
        })
        toast.success('Sessão finalizada e cobrança gerada com sucesso!')
      } else {
        toast.success('Sessão finalizada (pendente de cobrança futura).')
      }
      onSuccess?.()
      onOpenChange(false)
    } catch (e) {
      toast.error('Erro ao finalizar sessão ou gerar cobrança.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar Sessão e Cobrar</DialogTitle>
          <DialogDescription>
            A sessão será marcada como realizada. O valor configurado é de{' '}
            {formatCurrency(appointment.session_value || 0)}. Deseja cobrar esta sessão agora?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" disabled={loading} onClick={() => handleAction(false)}>
            Não, cobrar depois
          </Button>
          <Button disabled={loading} onClick={() => handleAction(true)}>
            Sim, gerar cobrança
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
