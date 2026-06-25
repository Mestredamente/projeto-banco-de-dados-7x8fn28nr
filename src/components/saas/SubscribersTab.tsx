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
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { SubscriberModal } from './SubscriberModal'

export function SubscribersTab() {
  const [subs, setSubs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)

  const load = () => {
    pb.collection('subscriptions')
      .getFullList({ expand: 'subscriber,plan', sort: '-created' })
      .then(setSubs)
      .catch(console.error)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = subs.filter(
    (s) =>
      s.expand?.subscriber?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.expand?.subscriber?.email?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full max-w-md bg-white border rounded-md px-3 py-1">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <Input
            placeholder="Buscar por Nome ou E-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0"
          />
        </div>
      </div>
      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assinante</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fim do Ciclo</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-medium text-slate-900">
                    {s.expand?.subscriber?.name || 'Sem nome'}
                  </div>
                  <div className="text-xs text-slate-500">{s.expand?.subscriber?.email}</div>
                </TableCell>
                <TableCell>{s.expand?.plan?.name || 'N/A'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      s.status === 'active'
                        ? 'default'
                        : s.status === 'past_due'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {s.current_period_end
                    ? new Date(s.current_period_end).toLocaleDateString('pt-BR')
                    : '-'}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setSelected(s)}>
                    Gerenciar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Nenhum assinante encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {selected && (
        <SubscriberModal
          sub={selected}
          onClose={() => {
            setSelected(null)
            load()
          }}
        />
      )}
    </div>
  )
}
