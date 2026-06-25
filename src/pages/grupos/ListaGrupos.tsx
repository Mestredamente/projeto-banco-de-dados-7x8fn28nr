import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Users } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBranding } from '@/hooks/use-branding'
import { getGrupos } from '@/services/grupos'
import useRealtime from '@/hooks/use-realtime'
import { Button } from '@/components/system/Button'
import { Input } from '@/components/system/Input'
import { Select } from '@/components/system/Select'
import { Badge } from '@/components/system/Badge'
import { Card } from '@/components/system/Card'
import { EmptyState } from '@/components/system/EmptyState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ListaGrupos() {
  const { user } = useAuth()
  const { clinic } = useBranding()
  const [grupos, setGrupos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tipoFilter, setTipoFilter] = useState('all')

  const loadData = async () => {
    try {
      let filter = ''
      if (user?.role === 'psicologo_autonomo') {
        filter = `psicologo_responsavel = '${user.id}'`
      } else if (user?.role === 'psicologo_vinculado') {
        filter = `psicologo_responsavel = '${user.id}' || clinica_id = '${clinic?.id}'`
      } else if (user?.role === 'admin_clinica') {
        filter = `clinica_id = '${clinic?.id}'`
      }

      const records = await getGrupos(filter)
      setGrupos(records)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, clinic])

  useRealtime('grupos_terapeuticos', () => loadData())

  const filtered = grupos.filter((g) => {
    const matchName = g.nome.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || g.status === statusFilter
    const matchTipo = tipoFilter === 'all' || g.tipo_grupo === tipoFilter
    return matchName && matchStatus && matchTipo
  })

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grupos Terapêuticos</h1>
          <p className="text-gray-500 mt-1">Gerencie os grupos e turmas da clínica.</p>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/grupos/novo">
            <Plus className="mr-2 h-4 w-4" /> Novo Grupo
          </Link>
        </Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar grupo por nome..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          options={[
            { label: 'Todos os Tipos', value: 'all' },
            { label: 'Psicoterapêutico', value: 'psicoterapeutico' },
            { label: 'Apoio', value: 'apoio' },
            { label: 'Psicoeducativo', value: 'psicoeducativo' },
            { label: 'Institucional', value: 'institucional' },
          ]}
          className="w-full sm:w-48"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'Todos os Status', value: 'all' },
            { label: 'Ativo', value: 'ativo' },
            { label: 'Inativo', value: 'inativo' },
            { label: 'Encerrado', value: 'encerrado' },
          ]}
          className="w-full sm:w-48"
        />
      </Card>

      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum grupo encontrado"
          description="Nenhum grupo terapêutico cadastrado. Crie o primeiro grupo para começar."
          action={{ label: 'Criar Grupo', onClick: () => (window.location.href = '/grupos/novo') }}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Grupo</TableHead>
                <TableHead>Tipo / Abordagem</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>Vagas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium text-primary">
                    <Link to={`/grupos/${g.id}`} className="hover:underline">
                      {g.nome}
                    </Link>
                    <div className="text-xs text-gray-500 font-normal truncate max-w-[200px]">
                      {g.expand?.psicologo_responsavel?.name}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                    {g.tipo_grupo}
                    {g.abordagem && (
                      <div className="text-xs text-gray-500">
                        {g.abordagem === 'outra' ? g.abordagem_outra : g.abordagem}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{g.modalidade}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-1 text-gray-400" />
                      {g.vagas_total - g.vagas_disponiveis} / {g.vagas_total}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        g.status === 'ativo'
                          ? 'success'
                          : g.status === 'encerrado'
                            ? 'secondary'
                            : 'warning'
                      }
                    >
                      {g.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/grupos/${g.id}`}>Gerenciar</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
