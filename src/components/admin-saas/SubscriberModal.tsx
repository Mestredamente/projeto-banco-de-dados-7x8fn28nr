import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, HardDrive, Users, Calendar } from 'lucide-react'

export function SubscriberModal({ subscription, open, onOpenChange, onUpdated }: any) {
  const user = subscription?.expand?.subscriber
  const [plans, setPlans] = useState<any[]>([])
  const [newPlan, setNewPlan] = useState<string>('')
  const [cancelReason, setCancelReason] = useState('')
  const [action, setAction] = useState<'view' | 'change_plan' | 'cancel'>('view')

  const [metrics, setMetrics] = useState({ patients: 0, sessions: 0 })

  useEffect(() => {
    if (open && user) {
      pb.collection('plans').getFullList().then(setPlans)
      pb.collection('patients')
        .getList(1, 1, { filter: `created_by="${user.id}"` })
        .then((res) => setMetrics((m) => ({ ...m, patients: res.totalItems })))
      pb.collection('appointments')
        .getList(1, 1, { filter: `professional="${user.id}"` })
        .then((res) => setMetrics((m) => ({ ...m, sessions: res.totalItems })))
    }
  }, [open, user])

  const handleChangePlan = async () => {
    try {
      await pb.collection('subscriptions').update(subscription.id, { plan: newPlan })
      toast.success('Plano alterado com sucesso (Pro-rata aplicada)')
      onUpdated()
      onOpenChange(false)
    } catch {
      toast.error('Erro ao alterar plano')
    }
  }

  const handleCancel = async () => {
    if (!cancelReason) return toast.error('Selecione um motivo de cancelamento')
    try {
      await pb.collection('subscriptions').update(subscription.id, {
        status: 'canceled',
        cancellation_reason: cancelReason,
        canceled_at: new Date().toISOString(),
      })
      toast.success('Assinatura cancelada')
      onUpdated()
      onOpenChange(false)
    } catch {
      toast.error('Erro ao cancelar')
    }
  }

  const handleReactivate = async () => {
    try {
      await pb.collection('subscriptions').update(subscription.id, {
        status: 'active',
        canceled_at: null,
        cancellation_reason: '',
      })
      toast.success('Assinatura reativada')
      onUpdated()
      onOpenChange(false)
    } catch {
      toast.error('Erro ao reativar')
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Assinante: {user.name}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        {action === 'view' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center">
                <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-xl font-bold">{metrics.patients}</div>
                <div className="text-xs text-muted-foreground">Pacientes</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center">
                <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-xl font-bold">{metrics.sessions}</div>
                <div className="text-xs text-muted-foreground">Sessões</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center">
                <HardDrive className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-xl font-bold">450 MB</div>
                <div className="text-xs text-muted-foreground">Armazenamento</div>
              </div>
            </div>

            <div className="border rounded-md p-4 space-y-2 text-sm">
              <p>
                <strong>Plano Atual:</strong> {subscription.expand?.plan?.name || 'N/A'}
              </p>
              <p>
                <strong>Status:</strong> {subscription.status.toUpperCase()}
              </p>
              <p>
                <strong>Data de Cadastro:</strong>{' '}
                {new Date(subscription.created).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              {subscription.status !== 'canceled' ? (
                <>
                  <Button variant="outline" onClick={() => setAction('change_plan')}>
                    Alterar Plano
                  </Button>
                  <Button variant="destructive" onClick={() => setAction('cancel')}>
                    Cancelar Assinatura
                  </Button>
                </>
              ) : (
                <Button onClick={handleReactivate}>Reativar Assinatura</Button>
              )}
            </div>
          </div>
        )}

        {action === 'change_plan' && (
          <div className="space-y-4">
            <h3 className="font-medium">Selecione o novo plano</h3>
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} - R${p.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAction('view')}>
                Voltar
              </Button>
              <Button onClick={handleChangePlan}>Confirmar Alteração</Button>
            </div>
          </div>
        )}

        {action === 'cancel' && (
          <div className="space-y-4">
            <div className="bg-red-50 text-red-900 p-3 rounded-md flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="text-sm">
                Você está prestes a cancelar a assinatura deste usuário. O acesso será revogado ao
                final do ciclo atual.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Motivo do Cancelamento (Obrigatório)</Label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um motivo..." />
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
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAction('view')}>
                Voltar
              </Button>
              <Button variant="destructive" onClick={handleCancel}>
                Confirmar Cancelamento
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
