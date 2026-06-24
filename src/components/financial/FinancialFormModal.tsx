import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import pb from '@/lib/pocketbase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

export function FinancialFormModal({ open, onOpenChange, onSuccess, defaultValues }: any) {
  const { user } = useAuth()
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, reset } = useForm()

  useEffect(() => {
    if (open) {
      pb.collection('patients')
        .getFullList({ filter: 'is_active = true', sort: 'name' })
        .then(setPatients)
        .catch(() => {})
      if (defaultValues) {
        reset({
          ...defaultValues,
          due_date: defaultValues.due_date?.split('T')[0],
          payment_date: defaultValues.payment_date?.split('T')[0],
        })
      } else {
        reset({ type: 'sessao', status: 'pendente', total: 0, payment_method: 'pix' })
      }
    }
  }, [open, defaultValues, reset])

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        professional: user?.id,
        due_date: data.due_date ? new Date(data.due_date + 'T12:00:00Z').toISOString() : null,
        payment_date: data.payment_date
          ? new Date(data.payment_date + 'T12:00:00Z').toISOString()
          : null,
      }
      if (defaultValues?.id) {
        await pb.collection('financial_records').update(defaultValues.id, payload)
        toast.success('Lançamento atualizado')
      } else {
        await pb.collection('financial_records').create(payload)
        toast.success('Lançamento criado')
      }
      onSuccess()
      onOpenChange(false)
    } catch (e) {
      toast.error('Erro ao salvar lançamento. Verifique se o valor é válido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Paciente</Label>
              <Select
                onValueChange={(v) => setValue('patient', v)}
                defaultValue={defaultValues?.patient}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                onValueChange={(v) => setValue('type', v)}
                defaultValue={defaultValues?.type || 'sessao'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sessao">Sessão</SelectItem>
                  <SelectItem value="pacote">Pacote</SelectItem>
                  <SelectItem value="mensalidade">Mensalidade</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                onValueChange={(v) => setValue('status', v)}
                defaultValue={defaultValues?.status || 'pendente'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor Total (R$)</Label>
              <Input type="number" step="0.01" {...register('total', { required: true, min: 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select
                onValueChange={(v) => setValue('payment_method', v)}
                defaultValue={defaultValues?.payment_method || 'pix'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="misto">Misto (Múltiplos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input type="date" {...register('due_date')} />
            </div>
            <div className="space-y-2">
              <Label>Data de Pagamento</Label>
              <Input type="date" {...register('payment_date')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
