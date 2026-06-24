import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import useRealtime from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, UserPlus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export default function Patients() {
  const [patients, setPatients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const { user } = useAuth()

  const loadData = async () => {
    try {
      if (user?.role === 'gestor_saas' || user?.role === 'admin_clinica') {
        const records = await pb.collection('patients').getFullList({
          filter: "deleted_at = '' && is_active = true",
          sort: 'name',
        })
        setPatients(records)
      } else if (user) {
        const pp = await pb.collection('patient_professionals').getFullList({
          filter: `professional = '${user.id}' && is_active = true && patient.deleted_at = ''`,
          expand: 'patient',
        })
        const uniquePatients = Array.from(
          new Map(pp.map((p) => [p.expand?.patient?.id, p.expand?.patient])).values(),
        ).filter(Boolean)
        setPatients(uniquePatients)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('patients', () => {
    loadData()
  })

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.cpf?.includes(search) ||
      p.phone?.includes(search),
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pacientes</h1>
          <p className="text-gray-500 mt-1">Gerencie a base de pacientes de forma segura.</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white" asChild>
          <Link to="/patients/new">
            <UserPlus className="mr-2 h-4 w-4" /> Novo Paciente
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, CPF ou telefone..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Nenhum paciente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">{p.phone || '-'}</div>
                      <div className="text-xs text-gray-500">{p.email}</div>
                    </TableCell>
                    <TableCell>{p.cpf || '-'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        Ativo
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/patients/${p.id}`}>Ver Perfil</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
