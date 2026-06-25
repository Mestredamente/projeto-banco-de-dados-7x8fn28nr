import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Sparkles, Info, CheckCircle2, XCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { PatientAnamnesisTab } from '@/components/patients/PatientAnamnesisTab'
import { PatientEvolutions } from '@/components/patients/PatientEvolutions'
import { PatientInsights } from '@/components/patients/PatientInsights'
import { PatientCrisisInterventions } from '@/components/patients/PatientCrisisInterventions'
import { PatientReferralsTab, ReferralDialog } from '@/components/patients/PatientReferralsTab'
import { PatientSessions } from '@/components/patients/PatientSessions'
import { PatientFinancialTab } from '@/components/patients/PatientFinancialTab'
import { PatientScales } from '@/components/patients/PatientScales'
import { Badge } from '@/components/system/Badge'

export default function PatientProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [patient, setPatient] = useState<any>(null)

  const query = new URLSearchParams(window.location.search)
  const defaultTab = query.get('anamnese') === 'true' ? 'anamnese' : 'dados'

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

  const [showRetentionAlert, setShowRetentionAlert] = useState(false)

  useEffect(() => {
    if (patient) {
      pb.send('/backend/v1/audit/view', {
        method: 'POST',
        body: JSON.stringify({ record_id: patient.id, table_name: 'patients' }),
      }).catch(() => {})

      pb.collection('session_notes')
        .getList(1, 1, { filter: `patient = '${patient.id}'`, sort: '-session_date' })
        .then((res) => {
          if (res.items.length > 0) {
            const lastDate = new Date(res.items[0].session_date || res.items[0].created)
            const extendedAt = patient.retention_extended_at
              ? new Date(patient.retention_extended_at)
              : null
            const compareDate = extendedAt && extendedAt > lastDate ? extendedAt : lastDate
            const fiveYearsAgo = new Date()
            fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)

            if (compareDate < fiveYearsAgo) {
              setShowRetentionAlert(true)
            }
          }
        })
        .catch(() => {})
    }
  }, [patient])

  const isPsychologist = ['psicologo_autonomo', 'psicologo_vinculado'].includes(user?.role || '')

  const [showReferralDialog, setShowReferralDialog] = useState(false)
  const [showLgpdDialog, setShowLgpdDialog] = useState(false)
  const [isLgpdDeleting, setIsLgpdDeleting] = useState(false)

  if (!patient) return <div className="p-8 text-center">Carregando...</div>

  const handleLgpdDelete = async (type: 'anonymize' | 'delete') => {
    try {
      setIsLgpdDeleting(true)
      await pb.send(`/backend/v1/patients/${patient.id}/lgpd`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      })
      toast({
        title: 'Operação concluída',
        description:
          type === 'anonymize'
            ? 'Paciente anonimizado com sucesso.'
            : 'Paciente excluído com sucesso.',
      })
      navigate('/patients')
    } catch (err: any) {
      toast({
        title: 'Ação bloqueada',
        description: err.response?.message || 'Ocorreu um erro ao processar a exclusão.',
        variant: 'destructive',
      })
    } finally {
      setIsLgpdDeleting(false)
      setShowLgpdDialog(false)
    }
  }

  const handleRetentionAction = async (action: 'maintain' | 'anonymize' | 'delete') => {
    try {
      if (action === 'maintain') {
        await pb.collection('patients').update(patient.id, {
          retention_extended_at: new Date().toISOString(),
        })
        toast({ title: 'Retenção estendida com sucesso.' })
      } else if (action === 'anonymize') {
        await pb.send(`/backend/v1/patients/${patient.id}/lgpd`, {
          method: 'POST',
          body: JSON.stringify({ type: 'anonymize' }),
        })
        toast({ title: 'Paciente anonimizado com sucesso.' })
        window.location.reload()
      } else if (action === 'delete') {
        await pb.send(`/backend/v1/patients/${patient.id}/lgpd`, {
          method: 'POST',
          body: JSON.stringify({ type: 'delete' }),
        })
        toast({ title: 'Paciente excluído com sucesso.' })
        navigate('/patients')
      }
      setShowRetentionAlert(false)
    } catch (error: any) {
      toast({
        title: 'Erro ao processar ação.',
        description: error.response?.message,
        variant: 'destructive',
      })
    }
  }

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

  const ConsentDisplayRow = ({ title, field }: { title: string; field: string }) => {
    const isAccepted = !!patient[field]
    const date = patient[field]
    return (
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
        <div>
          <p className="font-medium text-slate-900">{title}</p>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAccepted && date
              ? `Aceito em ${new Date(date).toLocaleString('pt-BR')}`
              : 'Não aceito ou pendente'}
          </p>
        </div>
        <div>
          {isAccepted ? (
            <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aceito
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
              <XCircle className="w-3.5 h-3.5 mr-1" /> Pendente
            </Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{patient.name}</h1>
          <p className="text-gray-500 mt-1">Paciente desde {patientSince}</p>
          {patient.minor_guardian_name && (
            <Badge variant="outline" className="mt-2 bg-amber-50 text-amber-700 border-amber-200">
              Responsável Legal: {patient.minor_guardian_name}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {isPsychologist && (
            <Button variant="secondary" onClick={() => setShowReferralDialog(true)}>
              Encaminhar Paciente
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to={`/patients/${patient.id}/edit`}>Editar Dados</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                Desativar Paciente
              </Button>
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
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDeactivate}
                >
                  Sim, Desativar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {isPsychologist && (
            <AlertDialog open={showLgpdDialog} onOpenChange={setShowLgpdDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Excluir Paciente</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Exclusão de Paciente (LGPD Art. 18)</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4 pt-2 text-left">
                    <p>Tem certeza? Esta ação é irreversível.</p>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-slate-700">
                      <strong className="text-slate-900 block mb-1">Anonimizar dados:</strong>
                      Remove informações pessoais (Nome, CPF, etc), mas mantém o histórico clínico e
                      estatísticas para sua base.
                    </div>
                    <div className="p-3 bg-red-50 rounded-md border border-red-100 text-red-800">
                      <strong className="text-red-900 block mb-1">Excluir completamente:</strong>
                      Apaga permanentemente o cadastro e todo o prontuário. Registros financeiros
                      serão mantidos anonimizados por 5 anos (compliance fiscal).
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                  <AlertDialogCancel disabled={isLgpdDeleting}>Cancelar</AlertDialogCancel>
                  <Button
                    variant="outline"
                    onClick={() => handleLgpdDelete('anonymize')}
                    disabled={isLgpdDeleting}
                  >
                    Anonimizar dados
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleLgpdDelete('delete')}
                    disabled={isLgpdDeleting}
                  >
                    Excluir completamente
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="bg-gray-100 dark:bg-gray-800 flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="dados">Dados Cadastrais</TabsTrigger>
          <TabsTrigger value="consentimentos">Consentimentos</TabsTrigger>
          <TabsTrigger value="sessoes">Sessões</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          {isPsychologist && (
            <>
              <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
              <TabsTrigger value="evolucoes">Evoluções</TabsTrigger>
              <TabsTrigger value="escalas">Escalas</TabsTrigger>
              <TabsTrigger
                value="crises"
                className="text-red-600 data-[state=active]:text-red-700 font-medium"
              >
                Crises
              </TabsTrigger>
              <TabsTrigger value="encaminhamentos">Encaminhamentos</TabsTrigger>
              <TabsTrigger
                value="insights"
                className="flex items-center gap-1.5 text-amber-600 data-[state=active]:text-amber-700"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Insights IA
              </TabsTrigger>
              <TabsTrigger value="observacoes">Observações</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="anamnese" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Avaliação Inicial (Anamnese)</CardTitle>
            </CardHeader>
            <CardContent>
              <PatientAnamnesisTab patient={patient} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolucoes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Clínica</CardTitle>
            </CardHeader>
            <CardContent>
              <PatientEvolutions patientId={patient.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessoes" className="mt-6">
          <PatientSessions patientId={patient.id} />
        </TabsContent>

        <TabsContent value="financeiro" className="mt-6">
          <PatientFinancialTab patientId={patient.id} />
        </TabsContent>

        <TabsContent value="escalas" className="mt-6">
          <PatientScales patientId={patient.id} />
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <PatientInsights patient={patient} />
        </TabsContent>

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

          {patient.minor_guardian_name && (
            <Card className="border-amber-100">
              <CardHeader className="bg-amber-50/50">
                <CardTitle className="text-amber-900">Responsável Legal</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-sm text-gray-500">Nome do Responsável</span>
                  <p className="font-medium">{patient.minor_guardian_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">CPF do Responsável</span>
                  <p className="font-medium">{patient.minor_guardian_cpf}</p>
                </div>
              </CardContent>
            </Card>
          )}

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
          <Card>
            <CardHeader>
              <CardTitle>Informações Clínicas Iniciais</CardTitle>
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

        <TabsContent value="consentimentos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle>Status dos Consentimentos (LGPD)</CardTitle>
                <CardDescription className="mt-1">
                  A gestão é feita exclusivamente pelo paciente através de seu portal.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ConsentDisplayRow title="Atendimento Clínico" field="consent_clinical_at" />
                <ConsentDisplayRow title="Quebra de Sigilo (Risco)" field="consent_risk_at" />
                <ConsentDisplayRow title="Pesquisa Científica" field="consent_research_at" />
                <ConsentDisplayRow title="Encaminhamento Clínico" field="consent_referral_at" />
              </div>
              {patient.primeiro_acesso_portal !== false && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-sm flex gap-3 items-start">
                  <Info className="w-5 h-5 shrink-0 text-amber-500" />
                  <p>
                    O paciente ainda não acessou o portal para revisar e aceitar os termos de
                    consentimento. O acesso clínico no painel pode estar restrito até a validação.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isPsychologist && (
          <>
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
            <TabsContent value="crises" className="mt-6">
              <PatientCrisisInterventions patientId={patient.id} />
            </TabsContent>
            <TabsContent value="encaminhamentos" className="mt-6">
              <PatientReferralsTab patientId={patient.id} />
            </TabsContent>
          </>
        )}
      </Tabs>

      {isPsychologist && (
        <ReferralDialog
          patient={patient}
          open={showReferralDialog}
          onOpenChange={setShowReferralDialog}
        />
      )}

      <AlertDialog open={showRetentionAlert} onOpenChange={setShowRetentionAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aviso de Retenção de Dados (CFP 012/2005)</AlertDialogTitle>
            <AlertDialogDescription>
              O prontuário de {patient.name} completou 5 anos desde a última evolução. Deseja
              mantê-lo ativo, anonimizar ou excluir os dados?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => handleRetentionAction('maintain')}>
              Manter ativo
            </Button>
            <Button variant="secondary" onClick={() => handleRetentionAction('anonymize')}>
              Anonimizar dados
            </Button>
            <Button variant="destructive" onClick={() => handleRetentionAction('delete')}>
              Eliminar dados
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
