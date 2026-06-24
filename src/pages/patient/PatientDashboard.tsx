import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { usePatient } from '@/hooks/use-patient'
import pb from '@/lib/pocketbase/client'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Video, MapPin, HeartPulse, Clock, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PatientDashboard() {
  const { user } = useAuth()
  const { patient, loading } = usePatient()
  const [nextAppointment, setNextAppointment] = useState<any>(null)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!patient) return
    const fetchDashboardData = async () => {
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const apps = await pb.collection('appointments').getList(1, 1, {
          filter: `patient="${patient.id}" && scheduled_date >= "${todayStr}" && status != 'cancelado'`,
          sort: 'scheduled_date,start_time',
          expand: 'professional',
        })
        setNextAppointment(apps.items[0])

        const diaries = await pb.collection('diary_entries').getFullList({
          filter: `patient="${patient.id}"`,
          sort: '-entry_date',
        })

        if (diaries.length > 0) {
          let currentStreak = 0
          let curr = new Date()
          const dates = new Set(
            diaries.map((d: any) => format(parseISO(d.entry_date), 'yyyy-MM-dd')),
          )

          if (dates.has(format(curr, 'yyyy-MM-dd'))) {
            currentStreak++
            curr.setDate(curr.getDate() - 1)
          } else if (dates.has(format(new Date(curr.setDate(curr.getDate() - 1)), 'yyyy-MM-dd'))) {
            currentStreak++
            curr.setDate(curr.getDate() - 1)
          }

          while (dates.has(format(curr, 'yyyy-MM-dd'))) {
            currentStreak++
            curr.setDate(curr.getDate() - 1)
          }
          setStreak(currentStreak)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchDashboardData()
  }, [patient])

  if (loading) return <div>Carregando...</div>

  const perms = patient?.portal_permissions || { diary: true, financial: true, evolutions: true }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Olá, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-teal-500 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-700">
              <Calendar className="h-5 w-5" />
              Próxima Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {format(parseISO(nextAppointment.scheduled_date), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="h-4 w-4" /> {nextAppointment.start_time} -{' '}
                      {nextAppointment.end_time}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Psicólogo: {nextAppointment.expand?.professional?.name}
                    </p>
                  </div>
                  <div className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 px-3 py-1 rounded-full text-xs font-medium uppercase">
                    {nextAppointment.session_type}
                  </div>
                </div>
                {nextAppointment.session_type?.toLowerCase() === 'online' &&
                  nextAppointment.meeting_link && (
                    <Button
                      variant="outline"
                      className="w-full text-teal-600 border-teal-200"
                      asChild
                    >
                      <a href={nextAppointment.meeting_link} target="_blank" rel="noreferrer">
                        <Video className="mr-2 h-4 w-4" /> Acessar Chamada
                      </a>
                    </Button>
                  )}
                {nextAppointment.session_type?.toLowerCase() === 'presencial' && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-md">
                    <MapPin className="h-4 w-4 text-gray-400" /> Consulta presencial no consultório.
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-gray-500">
                Nenhuma sessão agendada no momento.
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Button variant="link" className="w-full text-teal-600" asChild>
                <Link to="/patient-portal/agenda">Ver todos os agendamentos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {perms.diary && (
          <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-700">
                <HeartPulse className="h-5 w-5" />
                Diário de Sentimentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Como você está se sentindo hoje? Registrar seu humor ajuda no acompanhamento
                terapêutico.
              </p>
              <div className="flex items-center gap-2 text-orange-600 font-medium bg-orange-50 dark:bg-orange-950/50 p-3 rounded-lg w-fit">
                🔥 {streak} dias seguidos
              </div>
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" asChild>
                <Link to="/patient-portal/diary">Registrar agora</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {perms.evolutions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <FileText className="h-5 w-5" />
                Resumos e Orientações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Acesse as notas e orientações compartilhadas pelo seu psicólogo.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/patient-portal/evolutions">Ver Evoluções</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
