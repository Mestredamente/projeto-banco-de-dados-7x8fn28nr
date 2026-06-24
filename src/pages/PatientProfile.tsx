import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/ui/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

export default function PatientProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [patient, setPatient] = useState<any>(null)

  useEffect(() => {
    if (id) {
      pb.collection('patients')
        .getOne(id)
        .then(setPatient)
        .catch(() => {
          toast({ title: 'Erro ao carregar paciente', variant: 'destructive' })
          navigate('/patients')
        })
    }
  }, [id, navigate])

  if (!patient) return <div className="p-8 text-center">Carregando...</div>

  const isPsychologist = ['psicologo_autonomo', 'psicologo_vinculado'].includes(user?.role || '')

  const handleDeactivate = async () => {
    try {
      await pb.collection('patients').update(patient.id, {
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      toast({ title: 'Paciente desativado com sucesso' })
      navigate('/patients')
    } catch (e) {
      toast({ title: 'Erro ao desativar', variant: 'destructive' })
    }
  }

  const patientSince = new Date(patient.created).toLocaleDateString('pt-BR')

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{patient.name}</h1>
          <p className="text-gray-500 mt-1">Paciente desde {patientSince}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" asChild>
            <Link to={`/patients/${patient.id}/edit`}>Editar Dados</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Desativar Paciente</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  O paciente será ocultado da lista principal, mas o histórico clínico e financeiro
                  será mantido para conformidade.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDeactivate}
                >
                  Sim, Desativar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="bg-gray-100 dark:bg-gray-800 grid grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="emergencia">Emergência</TabsTrigger>
          <TabsTrigger value="clinico">Clínico</TabsTrigger>
          <TabsTrigger value="lgpd">Consentimentos</TabsTrigger>
          {isPsychologist && <TabsTrigger value="observacoes">Observações</TabsTrigger>}
        </TabsList>

        <TabsContent value="dados" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <span className="text-sm text-gray-500">Email</span>
                <p className="font-medium">{patient.email || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Telefone</span>
                <p className="font-medium">{patient.phone || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">CPF</span>
                <p className="font-medium">{patient.cpf || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">RG</span>
                <p className="font-medium">{patient.rg || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Nascimento</span>
                <p className="font-medium">
                  {patient.date_of_birth
                    ? new Date(patient.date_of_birth).toLocaleDateString('pt-BR')
                    : '-'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Gênero</span>
                <p className="font-medium">{patient.gender || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Estado Civil</span>
                <p className="font-medium">{patient.marital_status || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Profissão</span>
                <p className="font-medium">{patient.profession || '-'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <span className="text-sm text-gray-500">CEP</span>
                <p className="font-medium">{patient.address_cep || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm text-gray-500">Logradouro</span>
                <p className="font-medium">{patient.address_street || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Número</span>
                <p className="font-medium">{patient.address_number || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Bairro</span>
                <p className="font-medium">{patient.address_neighborhood || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Cidade / UF</span>
                <p className="font-medium">
                  {patient.address_city
                    ? `${patient.address_city} - ${patient.address_state}`
                    : '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergencia" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contato de Emergência</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="text-sm text-gray-500">Nome</span>
                <p className="font-medium">{patient.emergency_contact_name || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Telefone</span>
                <p className="font-medium">{patient.emergency_contact_phone || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Parentesco</span>
                <p className="font-medium">{patient.emergency_contact_relation || '-'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinico" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Clínicas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-sm text-gray-500">Convênio</span>
                <p className="font-medium">{patient.health_insurance || 'Particular'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Encaminhado por</span>
                <p className="font-medium">{patient.referred_by || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm text-gray-500">Histórico Clínico (Resumo)</span>
                <p className="font-medium mt-1 whitespace-pre-wrap">
                  {patient.clinical_history || 'Nenhum histórico registrado.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lgpd" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Consentimentos e LGPD</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${patient.consent_form_signed ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <div>
                  <p className="font-medium">Armazenamento de Dados de Saúde</p>
                  <p className="text-sm text-gray-500">
                    {patient.consent_form_signed
                      ? `Aceito em ${patient.consent_given_at ? new Date(patient.consent_given_at).toLocaleString('pt-BR') : '-'}`
                      : 'Não aceito'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${patient.ai_consent ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <div>
                  <p className="font-medium">Processamento por Inteligência Artificial</p>
                  <p className="text-sm text-gray-500">
                    {patient.ai_consent
                      ? `Aceito em ${patient.consent_given_at ? new Date(patient.consent_given_at).toLocaleString('pt-BR') : '-'}`
                      : 'Não aceito'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isPsychologist && (
          <TabsContent value="observacoes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Observações Internas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {patient.notes || 'Nenhuma observação registrada.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
