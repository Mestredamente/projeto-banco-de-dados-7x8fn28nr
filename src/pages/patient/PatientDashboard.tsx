import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  PhoneCall,
  HeartPulse,
  ShieldAlert,
  Calendar as CalendarIcon,
  DollarSign,
  FileText,
  ClipboardList,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PatientDashboard() {
  const { user } = useAuth()
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      const fetchAssignments = async () => {
        try {
          const now = new Date().toISOString()
          const result = await pb.collection('questionnaire_assignments').getList(1, 50, {
            filter: `status = "pendente" && due_date >= "${now}"`,
            expand: 'questionnaire',
            sort: '-created',
          })
          setPendingAssignments(result.items)
        } catch (error) {
          console.error('Failed to fetch questionnaire assignments:', error)
        }
      }

      fetchAssignments()
    }
  }, [user])

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Olá, {user?.name?.split(' ')[0] || 'Paciente'}
        </h1>
        <p className="text-muted-foreground">Bem-vindo ao seu portal.</p>
      </div>

      {pendingAssignments.length > 0 && (
        <div className="space-y-3">
          {pendingAssignments.map((assignment) => (
            <Alert key={assignment.id} className="border-l-4 border-l-amber-500 bg-amber-50/50">
              <ClipboardList className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-amber-800 font-semibold">
                Nova Escala Disponível
              </AlertTitle>
              <AlertDescription className="text-amber-700 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>
                  📋 Você tem uma escala para preencher:{' '}
                  <strong>{assignment.expand?.questionnaire?.title}</strong>
                </span>
                <Link to="#" className="text-amber-700 font-medium underline shrink-0">
                  Preencher agora
                </Link>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="inicio">
        <TabsList className="bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="inicio">Início</TabsTrigger>
          <TabsTrigger value="ajuda" className="text-red-600 data-[state=active]:text-red-700">
            Ajuda e Emergência
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inicio" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-shadow border-t-4 border-t-teal-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarIcon className="h-5 w-5 text-teal-600" />
                  Minha Agenda
                </CardTitle>
                <CardDescription>Próximas sessões</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  to="/patient-portal/agenda"
                  className="text-teal-600 font-medium hover:underline text-sm"
                >
                  Ver agendamentos →
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-t-4 border-t-rose-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HeartPulse className="h-5 w-5 text-rose-600" />
                  Meu Diário
                </CardTitle>
                <CardDescription>Escala de sentimentos</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  to="/patient-portal/diary"
                  className="text-rose-600 font-medium hover:underline text-sm"
                >
                  Acessar diário →
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-t-4 border-t-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Evoluções
                </CardTitle>
                <CardDescription>Resumos compartilhados</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  to="/patient-portal/evolutions"
                  className="text-blue-600 font-medium hover:underline text-sm"
                >
                  Ver evoluções →
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-t-4 border-t-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Financeiro
                </CardTitle>
                <CardDescription>Faturas e recibos</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  to="/patient-portal/financial"
                  className="text-green-600 font-medium hover:underline text-sm"
                >
                  Acessar financeiro →
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ajuda" className="mt-6">
          <Card className="border-red-100 bg-red-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <ShieldAlert className="h-5 w-5" />
                Contatos de Emergência
              </CardTitle>
              <CardDescription className="text-red-700/80">
                Se você está passando por um momento difícil, busque ajuda imediatamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-6 rounded-lg border border-red-100 shadow-sm flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-full shrink-0">
                  <PhoneCall className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900">
                    Precisa de ajuda urgente? CVV 188
                  </h3>
                  <p className="text-sm text-red-700 mt-2 leading-relaxed">
                    Você não está sozinho. O Centro de Valorização da Vida (CVV) realiza apoio
                    emocional e prevenção do suicídio, atendendo de forma voluntária e gratuita
                    todas as pessoas que querem e precisam conversar, sob total sigilo.
                  </p>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md font-bold">
                      <PhoneCall className="h-4 w-4" /> Ligue 188 (24h)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
