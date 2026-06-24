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
import { toast } from 'sonner'

export default function ProfessionalsTab() {
  const [links, setLinks] = useState<any[]>([])

  const load = async () => {
    try {
      const data = await pb
        .collection('clinic_professionals')
        .getFullList({ expand: 'professional' })
      setLinks(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleUnlink = async (id: string) => {
    if (
      confirm(
        'Definir destino dos pacientes: \n1. Transferir\n2. Notificar Reagendamento\n3. Manter Histórico Inativo\n\nConfirma desvinculação deste profissional?',
      )
    ) {
      await pb.collection('clinic_professionals').delete(id)
      toast.success('Profissional desvinculado com sucesso.')
      load()
    }
  }

  return (
    <div className="space-y-4 bg-card p-4 rounded-xl border">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Profissionais Vinculados</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie o quadro clínico e modelos de contratação.
          </p>
        </div>
        <Button>Convidar Profissional</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Contrato</TableHead>
            <TableHead>Percentual/Fixo</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="font-medium">{l.expand?.professional?.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="uppercase">
                  {l.relationship_model?.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {l.commission_percentage ? `${l.commission_percentage}%` : '-'} /{' '}
                {l.fixed_salary ? `R$ ${l.fixed_salary}` : '-'}
              </TableCell>
              <TableCell>
                <Button variant="destructive" size="sm" onClick={() => handleUnlink(l.id)}>
                  Desvincular
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {links.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4">
                Nenhum profissional vinculado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
