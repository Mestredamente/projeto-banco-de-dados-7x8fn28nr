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
import { formatCurrency } from '@/lib/currency'
import { toast } from '@/hooks/use-toast'

export function PlansTab() {
  const [plans, setPlans] = useState<any[]>([])

  useEffect(() => {
    pb.collection('plans').getFullList({ sort: 'sort_order' }).then(setPlans).catch(console.error)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Planos de Assinatura</h2>
        <Button
          onClick={() =>
            toast({
              title: 'Funcionalidade em desenvolvimento',
              description: 'Modal de criação de plano será aberto aqui.',
            })
          }
        >
          Criar Novo Plano
        </Button>
      </div>
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Limites (Pac/Sec)</TableHead>
              <TableHead>Trial</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  {formatCurrency(p.price || 0)}/{p.billing_cycle}
                </TableCell>
                <TableCell>
                  {p.max_patients || 'Ilimitado'} / {p.max_professionals || 'Ilimitado'}
                </TableCell>
                <TableCell>7 dias</TableCell>
                <TableCell>{p.is_active ? 'Ativo' : 'Inativo'}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast({
                        title: 'Aviso',
                        description:
                          'Lembre-se: Edições no valor aplicam-se apenas a novos assinantes.',
                      })
                    }
                  >
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {plans.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                  Nenhum plano encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
