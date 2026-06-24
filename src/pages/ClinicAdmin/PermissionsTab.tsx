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
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const FEATURES = [
  'agenda',
  'pacientes',
  'prontuario',
  'financeiro',
  'relatorios',
  'portal',
  'notificacoes',
  'estoque',
  'salas',
]

export default function PermissionsTab() {
  const [links, setLinks] = useState<any[]>([])

  const load = async () => {
    const data = await pb.collection('clinic_professionals').getFullList({ expand: 'professional' })
    setLinks(data)
  }

  useEffect(() => {
    load()
  }, [])

  const handleToggle = async (linkId: string, feature: string, currentVal: boolean) => {
    const link = links.find((l) => l.id === linkId)
    if (!link) return
    const perms = link.custom_permissions || {}
    perms[feature] = !currentVal
    await pb.collection('clinic_professionals').update(linkId, { custom_permissions: perms })
    toast.success('Permissão atualizada individualmente.')
    load()
  }

  return (
    <div className="space-y-4 bg-card p-4 rounded-xl border overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Matriz de Permissões</h2>
          <p className="text-sm text-muted-foreground">
            Herança baseada no contrato. Altere a checkbox para sobrescrever.
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          Restaurar Padrões do Contrato
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profissional</TableHead>
            {FEATURES.map((f) => (
              <TableHead key={f} className="capitalize">
                {f}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="font-medium min-w-[200px]">
                {l.expand?.professional?.name}
              </TableCell>
              {FEATURES.map((f) => {
                const hasPerm = l.custom_permissions?.[f] ?? l.relationship_model !== 'aluguel_sala'
                return (
                  <TableCell key={f}>
                    <Checkbox
                      checked={hasPerm}
                      onCheckedChange={() => handleToggle(l.id, f, hasPerm)}
                    />
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
