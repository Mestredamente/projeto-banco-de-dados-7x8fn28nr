import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  Calendar,
  DollarSign,
  Building,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  FileText,
  Palmtree,
  PackageOpen,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useManagerFilter } from '@/hooks/use-manager-filter'

export function ClinicHomeDashboard() {
  const { user } = useAuth()
  const { clinicIds, isSaaSAdmin } = useManagerFilter()
  const [stats, setStats] = useState({
    professionals: 0,
    appointmentsToday: 0,
    monthlyRevenue: 0,
    roomsActive: 0,
    lowStock: 0,
  })
  const [alerts, setAlerts] = useState<any[]>([])
  const [vacations, setVacations] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const profFilterParts = [`deleted_at = ""`]
        if (!isSaaSAdmin && clinicIds.length > 0) {
          profFilterParts.push(`(${clinicIds.map((id) => `clinic="${id}"`).join(' || ')})`)
        }
        const profs = await pb
          .collection('clinic_professionals')
          .getList(1, 1, { filter: profFilterParts.join(' && ') })
        const today = new Date().toISOString().split('T')[0]
        const apptFilterParts = [
          `scheduled_date >= "${today} 00:00:00"`,
          `scheduled_date <= "${today} 23:59:59"`,
          `deleted_at = ""`,
        ]
        if (!isSaaSAdmin && clinicIds.length > 0) {
          apptFilterParts.push(`(${clinicIds.map((id) => `clinic="${id}"`).join(' || ')})`)
        }
        const apps = await pb.collection('appointments').getList(1, 1, {
          filter: apptFilterParts.join(' && '),
        })

        const roomFilter =
          !isSaaSAdmin && clinicIds.length > 0
            ? clinicIds.map((id) => `clinic="${id}"`).join(' || ')
            : undefined
        const rooms = await pb.collection('rooms').getList(1, 1, {
          filter: roomFilter,
        })

        const finFilterParts = [`status = "pago"`, `deleted_at = ""`]
        if (!isSaaSAdmin && clinicIds.length > 0) {
          finFilterParts.push(`(${clinicIds.map((id) => `clinic="${id}"`).join(' || ')})`)
        }
        const finRecords = await pb.collection('financial_records').getFullList({
          filter: finFilterParts.join(' && '),
        })
        const revenue = finRecords.reduce((acc, curr) => acc + (curr.total || curr.value || 0), 0)

        const stockFilter =
          !isSaaSAdmin && clinicIds.length > 0
            ? clinicIds.map((id) => `clinic="${id}"`).join(' || ')
            : undefined
        const stockItems = await pb.collection('inventory_items').getFullList({
          filter: stockFilter,
        })
        const lowStockItems = stockItems.filter((item) => item.quantity <= (item.min_stock || 0))

        setStats({
          professionals: profs.totalItems,
          appointmentsToday: apps.totalItems,
          monthlyRevenue: revenue,
          roomsActive: rooms.totalItems,
          lowStock: lowStockItems.length,
        })

        const pendencies = await pb.collection('notifications').getList(1, 5, {
          filter: `profile = "${user?.id}" && read = false && type = "admin_alert"`,
          sort: '-created',
        })
        setAlerts(pendencies.items)

        const vacData = await pb.collection('vacation_requests').getList(1, 5, {
          filter: `status = "aprovada" && end_date >= "${today} 00:00:00"`,
          expand: 'requester',
          sort: 'start_date',
        })
        setVacations(vacData.items)
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [user])

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Home da Clínica
          </h1>
          <p className="text-gray-500 mt-1">Visão geral administrativa e gestão</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="bg-white">
            <Link to="/clinic-admin">
              <UserPlus className="mr-2 h-4 w-4" /> Convidar Profissional
            </Link>
          </Button>
          <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white">
            <Link to="/secretaries">
              <Users className="mr-2 h-4 w-4" /> Registrar Secretária
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Profissionais</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.professionals}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-teal-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Agenda Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appointmentsToday}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Faturamento Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Salas</CardTitle>
            <Building className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.roomsActive}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Estoque Baixo</CardTitle>
            <PackageOpen className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palmtree className="h-5 w-5 text-green-600" />
              Férias e Ausências (Staff)
            </CardTitle>
            <CardDescription>Próximas ausências programadas da equipe.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {vacations.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  Nenhuma ausência programada.
                </div>
              ) : (
                vacations.map((vac) => (
                  <div
                    key={vac.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold text-xs">
                        {vac.expand?.requester?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {vac.expand?.requester?.name || 'Funcionário'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {vac.start_date.split(' ')[0]} até {vac.end_date.split(' ')[0]}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Últimos Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-500 text-sm">
                  <AlertTriangle className="h-8 w-8 mb-2 opacity-20 text-green-500" />
                  <p>Tudo em dia! Nenhuma pendência no momento.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex flex-col gap-1 border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {alert.title}
                      </span>
                      <span className="text-xs text-gray-500">{alert.body}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-lg">Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                asChild
              >
                <Link to="/reports">
                  <FileText className="h-5 w-5" /> Relatórios
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:text-green-700 transition-colors"
                asChild
              >
                <Link to="/financeiro">
                  <DollarSign className="h-5 w-5" /> Financeiro
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
