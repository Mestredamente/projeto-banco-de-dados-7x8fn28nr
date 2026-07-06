import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Calendar,
  ClipboardList,
  Activity,
  CreditCard,
  Share2,
  Settings,
  Lightbulb,
  Edit,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

import { PatientAnamnesisTab } from '@/components/patients/PatientAnamnesisTab'
import { PatientEvolutions } from '@/components/patients/PatientEvolutions'
import { PatientFinancialTab } from '@/components/patients/PatientFinancialTab'
import { PatientSessions } from '@/components/patients/PatientSessions'
import { PatientReferralsTab } from '@/components/patients/PatientReferralsTab'
import { PatientPreferencesTab } from '@/components/patients/PatientPreferencesTab'
import { PatientInsights } from '@/components/patients/PatientInsights'
import { PatientScales } from '@/components/patients/PatientScales'
import { PatientCrisisInterventions } from '@/components/patients/PatientCrisisInterventions'

export default function PatientProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const defaultTab = location.state?.tab || 'resumo'

  useEffect(() => {
    if (id) loadPatient()
  }, [id])

  const loadPatient = async () => {
    try {
      setLoading(true)
      const data = await pb.collection('patients').getOne(id!)
      setPatient(data)
    } catch (error) {
      console.error(error)
      toast({ title: 'Erro', description: 'Paciente não encontrado', variant: 'destructive' })
      navigate('/patients')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!patient) return null

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/patients')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{patient.name}</h1>
            <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground mt-1">
              {patient.email && <span>{patient.email}</span>}
              {patient.email && patient.phone && <span>•</span>}
              {patient.phone && <span>{patient.phone}</span>}
              {patient.status_paciente && (
                <>
                  <span>•</span>
                  <Badge variant="secondary" className="uppercase text-[10px]">
                    {patient.status_paciente}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/patients/${patient.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Dados
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <TabsList className="inline-flex h-auto justify-start gap-1 p-1 bg-muted/50 rounded-lg min-w-max">
            <TabsTrigger value="resumo" className="flex gap-2 py-2">
              <User className="w-4 h-4" /> <span className="hidden md:inline">Resumo</span>
            </TabsTrigger>
            <TabsTrigger value="sessoes" className="flex gap-2 py-2">
              <Calendar className="w-4 h-4" /> <span className="hidden md:inline">Sessões</span>
            </TabsTrigger>
            <TabsTrigger value="anamnese" className="flex gap-2 py-2">
              <ClipboardList className="w-4 h-4" />{' '}
              <span className="hidden md:inline">Anamnese</span>
            </TabsTrigger>
            <TabsTrigger value="evolucoes" className="flex gap-2 py-2">
              <Activity className="w-4 h-4" /> <span className="hidden md:inline">Evoluções</span>
            </TabsTrigger>
            <TabsTrigger value="escalas" className="flex gap-2 py-2">
              <FileText className="w-4 h-4" /> <span className="hidden md:inline">Escalas</span>
            </TabsTrigger>
            <TabsTrigger value="crise" className="flex gap-2 py-2">
              <AlertTriangle className="w-4 h-4" /> <span className="hidden md:inline">Crise</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex gap-2 py-2">
              <Lightbulb className="w-4 h-4" /> <span className="hidden md:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex gap-2 py-2">
              <CreditCard className="w-4 h-4" />{' '}
              <span className="hidden md:inline">Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="encaminhamentos" className="flex gap-2 py-2">
              <Share2 className="w-4 h-4" />{' '}
              <span className="hidden md:inline">Encaminhamentos</span>
            </TabsTrigger>
            <TabsTrigger value="preferencias" className="flex gap-2 py-2">
              <Settings className="w-4 h-4" />{' '}
              <span className="hidden md:inline">Preferências</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4">
          <TabsContent value="resumo" className="space-y-6 m-0">
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>Informações básicas do paciente.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                  <p className="mt-1">{patient.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CPF</p>
                  <p className="mt-1">{patient.cpf || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                  <p className="mt-1">
                    {patient.date_of_birth
                      ? new Date(patient.date_of_birth).toLocaleDateString('pt-BR', {
                          timeZone: 'UTC',
                        })
                      : 'Não informada'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gênero</p>
                  <p className="mt-1 capitalize">{patient.gender || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Profissão</p>
                  <p className="mt-1">{patient.profession || 'Não informada'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado Civil</p>
                  <p className="mt-1 capitalize">{patient.marital_status || 'Não informado'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contato e Endereço</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                  <p className="mt-1">{patient.phone || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                  <p className="mt-1">{patient.email || 'Não informado'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Endereço Completo</p>
                  <p className="mt-1">
                    {[
                      patient.address_street,
                      patient.address_number,
                      patient.address_complement,
                      patient.address_neighborhood,
                      patient.address_city,
                      patient.address_state,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Não informado'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Clínicas e Emergência</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contato de Emergência</p>
                  <p className="mt-1">
                    {patient.emergency_contact_name
                      ? `${patient.emergency_contact_name} (${patient.emergency_contact_relation || 'Sem relação'}) - ${patient.emergency_contact_phone || 'Sem telefone'}`
                      : 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Convênio / Plano</p>
                  <p className="mt-1">{patient.health_insurance || 'Particular'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessoes" className="m-0">
            <PatientSessions patientId={patient.id} />
          </TabsContent>

          <TabsContent value="anamnese" className="m-0">
            <PatientAnamnesisTab patientId={patient.id} />
          </TabsContent>

          <TabsContent value="evolucoes" className="m-0">
            <PatientEvolutions patientId={patient.id} />
          </TabsContent>

          <TabsContent value="escalas" className="m-0">
            <PatientScales patientId={patient.id} />
          </TabsContent>

          <TabsContent value="crise" className="m-0">
            <PatientCrisisInterventions patientId={patient.id} />
          </TabsContent>

          <TabsContent value="insights" className="m-0">
            <PatientInsights patientId={patient.id} />
          </TabsContent>

          <TabsContent value="financeiro" className="m-0">
            <PatientFinancialTab patientId={patient.id} />
          </TabsContent>

          <TabsContent value="encaminhamentos" className="m-0">
            <PatientReferralsTab patientId={patient.id} />
          </TabsContent>

          <TabsContent value="preferencias" className="m-0">
            <PatientPreferencesTab patientId={patient.id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
