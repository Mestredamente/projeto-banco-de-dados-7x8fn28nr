import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function CouponsTab() {
  const [coupons, setCoupons] = useState<any[]>([])

  useEffect(() => {
    pb.collection('coupons').getFullList({ sort: '-created' }).then(setCoupons).catch(console.error)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Cupons de Desconto</h2>
        <Button>Novo Cupom</Button>
      </div>
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Desconto</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Uso (Atual/Máx)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-bold text-primary tracking-wider">{c.code}</TableCell>
                <TableCell>{c.type === 'percent' ? `${c.value}%` : `R$ ${c.value}`}</TableCell>
                <TableCell>
                  {c.expires_at
                    ? new Date(c.expires_at).toLocaleDateString('pt-BR')
                    : 'Sem validade'}
                </TableCell>
                <TableCell>
                  {c.current_uses || 0} / {c.max_uses || 'Ilimitado'}
                </TableCell>
                <TableCell>
                  <Badge variant={c.is_active ? 'default' : 'secondary'}>
                    {c.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {coupons.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Nenhum cupom ativo no sistema
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
