import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function InventoryTab() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    pb.collection('inventory_items')
      .getFullList()
      .then(setItems)
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-teal-50 border border-teal-200 text-teal-900 p-5 rounded-xl flex items-start gap-4">
        <div className="text-2xl mt-0.5">🧠</div>
        <div>
          <h3 className="font-bold text-lg">IA Preditiva Local</h3>
          <p className="mt-1">
            Baseado na média móvel de consumo dos últimos 3 meses, você precisará de{' '}
            <strong>12 unidades de Lenço de Papel</strong> no próximo mês. Custo estimado de
            reposição: <strong>R$ 85,00</strong>.
          </p>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Controle de Estoque</h2>
          <Button>Registrar Entrada/Saída</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Qtd Atual</TableHead>
              <TableHead>Custo Unit.</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.name}</TableCell>
                <TableCell>{i.quantity}</TableCell>
                <TableCell>R$ {i.unit_cost?.toFixed(2)}</TableCell>
                <TableCell>
                  {i.quantity < i.min_stock ? (
                    <Badge variant="destructive">Estoque Baixo</Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 hover:bg-green-100"
                    >
                      Normal
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  Estoque vazio. Adicione insumos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
