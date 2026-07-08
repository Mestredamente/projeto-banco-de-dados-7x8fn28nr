import { useState, useEffect, useCallback } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/system/ErrorState'
import { EmptyState } from '@/components/system/EmptyState'
import { toast } from 'sonner'
import { useRealtime } from '@/hooks/use-realtime'
import { useManagerFilter } from '@/hooks/use-manager-filter'

export default function ProfessionalsTab() {
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isSaaSAdmin, clinicIds } = useManagerFilter()

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let filter: string | undefined
      if (!isSaaSAdmin) {
        if (clinicIds.length === 0) {
          setLinks([])
          return
        }
        filter = clinicIds.map((id) => `clinic="${id}"`).join(' || ')
      }

      const data = await pb.collection('clinic_professionals').getFullList({
        filter,
        expand: 'professional',
        sort: '-created',
      })
      setLinks(data)
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar a lista de profissionais.')
    } finally {
      setLoading(false)
    }
  }, [isSaaSAdmin, clinicIds])

  useEffect(() => {
    load()
  }, [load])

  useRealtime('clinic_professionals', () => {
    load()
  })

  useRealtime('users', () => {
    load()
  })

  const handleUnlink = async (id: string) => {
    if (
      confirm(
        'Definir destino dos pacientes: \n1. Transferir\n2. Notificar Reagendamento\n3. Manter Histórico Inativo\n\nConfirma desvinculação deste profissional?',
      )
    ) {
      try {
        await pb.collection('clinic_professionals').delete(id)
        toast.success('Profissional desvinculado com sucesso.')
        load()
      } catch (err) {
        toast.error('Erro ao desvincular profissional.')
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 bg-card p-4 rounded-xl border">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorState title="Erro de Carregamento" message={error} onRetry={load} />
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

      {links.length === 0 ? (
        <EmptyState
          context="custom"
          title="Nenhum profissional vinculado"
          description="Não há profissionais vinculados a esta clínica no momento."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Percentual/Fixo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">
                  {l.expand?.professional?.name || 'Sem nome'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="uppercase">
                    {l.relationship_model?.replace('_', ' ') || '-'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {l.commission_percentage ? `${l.commission_percentage}%` : '-'} /{' '}
                  {l.fixed_salary ? `R$ ${l.fixed_salary}` : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={l.is_active ? 'default' : 'secondary'}>
                    {l.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm" onClick={() => handleUnlink(l.id)}>
                    Desvincular
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
