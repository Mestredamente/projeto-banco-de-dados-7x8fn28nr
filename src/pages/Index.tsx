import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar as CalendarIcon, CheckCircle2, DollarSign } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import useRealtime from '@/hooks/use-realtime'

export default function Index() {
  const [stats, setStats] = useState({ today: 0, pending: 0, patients: 0, revenue: 0 })
  const [appointments, setAppointments] = useState<any[]>([])

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [todayApps, patientsData] = await Promise.all([
        pb
          .collection('appointments')
          .getList(1, 5, {
            filter: `scheduled_date >= "${today} 00:00:00" && scheduled_date <= "${today} 23:59:59"`,
            expand: 'patient',
          }),
        pb.collection('patients').getList(1, 1, { filter: 'is_active = true' }),
      ])

      setStats({
        today: todayApps.totalItems,
        pending: todayApps.items.filter((a) => a.status === 'agendado').length,
        patients: patientsData.totalItems,
        revenue: todayApps.items.reduce((acc, a) => acc + (a.session_value || 0), 0),
      })
      setAppointments(todayApps.items)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('appointments', () => {
    loadData()
  })

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 mt-1">Bem-vindo ao seu painel de controle diário.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Consultas Hoje"
          value={stats.today}
          icon={<CalendarIcon className="h-4 w-4 text-teal-600" />}
        />
        <StatCard
          title="Pendentes Confirmação"
          value={stats.pending}
          icon={<CheckCircle2 className="h-4 w-4 text-yellow-600" />}
        />
        <StatCard
          title="Total Pacientes Ativos"
          value={stats.patients}
          icon={<Users className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          title="Faturamento Previsto Hoje"
          value={`R$ ${stats.revenue.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4 text-green-600" />}
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Agenda de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum agendamento para hoje.</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{apt.expand?.patient?.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(apt.scheduled_date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      - {apt.session_type || 'Sessão'}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      apt.status === 'agendado'
                        ? 'bg-blue-100 text-blue-800'
                        : apt.status === 'realizado'
                          ? 'bg-green-100 text-green-800'
                          : apt.status === 'cancelado'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <Card className="shadow-sm border-t-4 border-t-teal-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
