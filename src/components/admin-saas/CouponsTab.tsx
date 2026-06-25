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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { Plus, Tag } from 'lucide-react'

export function CouponsTab() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent',
    value: 0,
    max_uses: 100,
    current_uses: 0,
    is_active: true,
  })

  async function load() {
    try {
      const data = await pb.collection('coupons').getFullList({ sort: '-created' })
      setCoupons(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async () => {
    try {
      await pb.collection('coupons').create(formData)
      toast.success('Cupom criado com sucesso')
      setOpen(false)
      load()
    } catch (err: any) {
      toast.error('Erro ao criar cupom')
    }
  }

  const generateCode = () => {
    const code = 'PROMO' + Math.random().toString(36).substring(2, 8).toUpperCase()
    setFormData({ ...formData, code })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Cupons de Desconto</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() =>
                setFormData({
                  code: '',
                  type: 'percent',
                  value: 0,
                  max_uses: 100,
                  current_uses: 0,
                  is_active: true,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cupom</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Código</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                  />
                  <Button variant="outline" onClick={generateCode}>
                    Gerar
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Porcentagem (%)</SelectItem>
                      <SelectItem value="value">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Limite de Usos</Label>
                <Input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active-coupon"
                  checked={formData.is_active}
                  onCheckedChange={(c) => setFormData({ ...formData, is_active: !!c })}
                />
                <Label htmlFor="active-coupon">Ativo</Label>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave}>Criar Cupom</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-muted-foreground" /> {c.code}
                </TableCell>
                <TableCell>{c.type === 'percent' ? 'Porcentagem' : 'Valor Fixo'}</TableCell>
                <TableCell>{c.type === 'percent' ? `${c.value}%` : `R$ ${c.value}`}</TableCell>
                <TableCell>
                  {c.current_uses} / {c.max_uses}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {c.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
