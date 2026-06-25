import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import pb from '@/lib/pocketbase/client'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'
import { Plus, Edit } from 'lucide-react'

export function PlansTab() {
  const [plans, setPlans] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    description: '',
    max_professionals: 1,
    max_patients: 0,
    trial_days: 0,
    is_active: true,
  })

  async function load() {
    try {
      const data = await pb.collection('plans').getFullList({ sort: 'sort_order' })
      setPlans(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async () => {
    try {
      if (editingPlan) {
        if (editingPlan.price !== formData.price) {
          toast.info('Alteração de preço vale apenas para novos assinantes ou renovações.')
        }
        await pb.collection('plans').update(editingPlan.id, formData)
        toast.success('Plano atualizado')
      } else {
        await pb.collection('plans').create({ ...formData, sort_order: plans.length + 1 })
        toast.success('Plano criado')
      }
      setOpen(false)
      load()
    } catch (err: any) {
      toast.error('Erro ao salvar plano')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingPlan(null)
                setFormData({
                  name: '',
                  price: 0,
                  description: '',
                  max_professionals: 1,
                  max_patients: 0,
                  trial_days: 0,
                  is_active: true,
                })
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome do Plano</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Preço Mensal (R$)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Dias de Trial</Label>
                  <Input
                    type="number"
                    value={formData.trial_days}
                    onChange={(e) =>
                      setFormData({ ...formData, trial_days: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Limite de Profissionais/Secretárias</Label>
                  <Input
                    type="number"
                    value={formData.max_professionals}
                    onChange={(e) =>
                      setFormData({ ...formData, max_professionals: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Limite de Pacientes (0 = sem limite)</Label>
                  <Input
                    type="number"
                    value={formData.max_patients}
                    onChange={(e) =>
                      setFormData({ ...formData, max_patients: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(c) => setFormData({ ...formData, is_active: !!c })}
                />
                <Label htmlFor="active">Ativo (Disponível para assinatura)</Label>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Limites</TableHead>
              <TableHead>Trial</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{formatCurrency(p.price)}</TableCell>
                <TableCell>
                  {p.max_professionals} Profissionais /{' '}
                  {p.max_patients === 0 ? 'Ilimitado' : p.max_patients} Pacientes
                </TableCell>
                <TableCell>{p.trial_days || 0} dias</TableCell>
                <TableCell>{p.is_active ? 'Ativo' : 'Inativo'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingPlan(p)
                      setFormData(p)
                      setOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
