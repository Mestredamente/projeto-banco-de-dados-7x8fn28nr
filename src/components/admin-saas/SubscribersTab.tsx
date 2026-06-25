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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import pb from '@/lib/pocketbase/client'
import { SubscriberModal } from './SubscriberModal'
import { Search } from 'lucide-react'

export function SubscribersTab() {
  const [subs, setSubs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSub, setSelectedSub] = useState<any>(null)

  async function load() {
    try {
      const data = await pb.collection('subscriptions').getFullList({
        expand: 'subscriber,plan',
        sort: '-created',
      })
      setSubs(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = subs.filter((s) => {
    const user = s.expand?.subscriber
    if (!user) return false
    const matchSearch =
      (user.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (user.cpf || '').includes(search)
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="past_due">Inadimplente</SelectItem>
            <SelectItem value="canceled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md bg-white dark:bg-gray-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Cadastro</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.expand?.subscriber?.name || 'N/A'}</TableCell>
                <TableCell>{s.expand?.subscriber?.email || 'N/A'}</TableCell>
                <TableCell>{s.expand?.plan?.name || 'N/A'}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium
                    ${
                      s.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : s.status === 'past_due'
                          ? 'bg-yellow-100 text-yellow-700'
                          : s.status === 'canceled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {s.status.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell>{new Date(s.created).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setSelectedSub(s)}>
                    Gerenciar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  Nenhum assinante encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedSub && (
        <SubscriberModal
          subscription={selectedSub}
          open={!!selectedSub}
          onOpenChange={(v: boolean) => {
            if (!v) setSelectedSub(null)
          }}
          onUpdated={load}
        />
      )}
    </div>
  )
}
