import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'

export function SubscriberModal({ sub, onClose }: { sub: any; onClose: () => void }) {
  const [reason, setReason] = useState('')

  const handleCancel = async () => {
    if (!reason)
      return toast({
        title: 'Atenção',
        description: 'Selecione um motivo de cancelamento.',
        variant: 'destructive',
      })
    try {
      await pb.collection('subscriptions').update(sub.id, {
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      toast({ title: 'Cancelado', description: 'Assinatura cancelada com sucesso.' })
      onClose()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao cancelar', variant: 'destructive' })
    }
  }

  const sendOffer = async () => {
    try {
      await pb.collection('subscriptions').update(sub.id, {
        retention_offer_sent_at: new Date().toISOString(),
        retention_offer_status: 'pending',
      })
      toast({ title: 'Oferta enviada', description: 'E-mail de retenção disparado com sucesso.' })
      onClose()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao enviar oferta', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Assinante</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block">Nome</span>
              <span className="font-semibold">{sub.expand?.subscriber?.name}</span>
            </div>
            <div>
              <span className="text-gray-500 block">E-mail</span>
              <span className="font-semibold">{sub.expand?.subscriber?.email}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Plano Atual</span>
              <span className="font-semibold">{sub.expand?.plan?.name}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Status</span>
              <span className="font-semibold">{sub.status}</span>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium text-red-600">Ações Críticas</h4>
            <div className="space-y-3 bg-red-50 p-4 rounded-md border border-red-100">
              <div className="space-y-1">
                <Label>Motivo do Cancelamento</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione o motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Preço alto">Preço alto</SelectItem>
                    <SelectItem value="Não estava usando">Não estava usando</SelectItem>
                    <SelectItem value="Outro sistema">Mudou para outro sistema</SelectItem>
                    <SelectItem value="Atendimento">Problemas com atendimento</SelectItem>
                    <SelectItem value="Problemas técnicos">Problemas técnicos</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="destructive" onClick={handleCancel}>
                  Confirmar Cancelamento
                </Button>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-100"
                  onClick={sendOffer}
                >
                  Enviar Oferta de Retenção Automática
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
