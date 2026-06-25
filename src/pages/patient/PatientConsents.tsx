import { useState } from 'react'
import { usePatient } from '@/hooks/use-patient'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, History, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/system/Badge'

export default function PatientConsents() {
  const { patient, loading } = usePatient()
  const [isUpdating, setIsUpdating] = useState(false)
  const [revokeAction, setRevokeAction] = useState<{
    field: string
    name: string
    warning?: string
  } | null>(null)

  if (loading || !patient) return <div className="p-8 text-center">Carregando...</div>

  const handleUpdateConsent = async (field: string, name: string, value: boolean) => {
    setIsUpdating(true)
    try {
      const now = new Date().toISOString()
      const newHistoryEntry = {
        action: value ? 'Aceito' : 'Revogado',
        type: name,
        date: now,
      }

      const data = {
        [field]: value ? now : null,
        consent_history: [...(patient.consent_history || []), newHistoryEntry],
      }

      // Mirror side effects
      if (field === 'consent_research_at') data.research_consent = value
      if (field === 'consent_risk_at') {
        data.portal_permissions = {
          ...(patient.portal_permissions || {}),
          life_protection_consent: value,
        }
      }

      await pb.collection('patients').update(patient.id, data)
      toast({ title: `Consentimento ${value ? 'aceito' : 'revogado'} com sucesso` })
      window.location.reload() // Refresh to update usePatient context
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' })
    } finally {
      setIsUpdating(false)
      setRevokeAction(null)
    }
  }

  const ConsentRow = ({
    title,
    description,
    field,
    isMandatory = false,
    warning,
  }: {
    title: string
    description: string
    field: string
    isMandatory?: boolean
    warning?: string
  }) => {
    const isAccepted = !!patient[field]
    const date = patient[field]

    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-slate-100 bg-white gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
            {isAccepted ? (
              <Badge
                variant="success"
                className="bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aceito
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                <XCircle className="w-3.5 h-3.5 mr-1" /> Não aceito
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
          {isAccepted && date && (
            <p className="text-xs text-slate-400 font-medium">
              Última atualização:{' '}
              {format(parseISO(date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-end">
          {isMandatory ? (
            <span className="text-xs font-medium text-slate-400 px-3 py-1.5 bg-slate-50 rounded-md border border-slate-100">
              Obrigatório para uso do sistema
            </span>
          ) : isAccepted ? (
            <Button
              variant="outline"
              size="sm"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setRevokeAction({ field, name: title, warning })}
              disabled={isUpdating}
            >
              Revogar Consentimento
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-teal-600 text-white hover:bg-teal-700"
              onClick={() => handleUpdateConsent(field, title, true)}
              disabled={isUpdating}
            >
              Aceitar Consentimento
            </Button>
          )}
        </div>
      </div>
    )
  }

  const history = [...(patient.consent_history || [])].reverse()

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6 pb-12 animate-fade-in">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-teal-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Consentimentos</h1>
          <p className="text-gray-500">Gerencie suas permissões de uso de dados e privacidade.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <ConsentRow
            title="Atendimento Clínico"
            field="consent_clinical_at"
            isMandatory={true}
            description="Autorizo o armazenamento e tratamento dos meus dados para fins de atendimento clínico, conforme a LGPD."
          />
          <ConsentRow
            title="Quebra de Sigilo (Risco)"
            field="consent_risk_at"
            warning="Ao revogar este consentimento, o diário de sentimentos será desativado. Registros anteriores serão mantidos de forma anônima."
            description="Autorizo a quebra de sigilo em caso de risco iminente à minha vida ou de terceiros, conforme previsto no Código de Ética do Psicólogo e na LGPD."
          />
          <ConsentRow
            title="Pesquisa Científica"
            field="consent_research_at"
            description="Autorizo o uso anonimizado dos meus dados para fins de pesquisa científica."
          />
          <ConsentRow
            title="Encaminhamento Clínico"
            field="consent_referral_at"
            description="Autorizo o compartilhamento dos meus dados anonimizados (idade, queixa principal, especialidade) com outros psicólogos para fins de encaminhamento clínico."
          />
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm sticky top-6">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-slate-500" />
                Histórico de Alterações
              </CardTitle>
              <CardDescription>Linha do tempo das suas decisões</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-5 space-y-6">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Nenhum registro encontrado.
                  </p>
                ) : (
                  <div className="relative border-l border-slate-200 ml-3 space-y-6">
                    {history.map((entry: any, i: number) => (
                      <div key={i} className="relative pl-6">
                        <div
                          className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                            entry.action === 'Aceito' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-900">{entry.type}</p>
                          <p className="text-xs text-slate-500">
                            {entry.action} em{' '}
                            {format(parseISO(entry.date), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!revokeAction} onOpenChange={(o) => !o && setRevokeAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Revogação
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                Tem certeza que deseja revogar o consentimento de{' '}
                <strong>{revokeAction?.name}</strong>?
              </p>
              {revokeAction?.warning && (
                <div className="p-3 bg-amber-50 text-amber-800 rounded-md text-sm border border-amber-100">
                  {revokeAction.warning}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() =>
                revokeAction && handleUpdateConsent(revokeAction.field, revokeAction.name, false)
              }
            >
              Sim, Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
