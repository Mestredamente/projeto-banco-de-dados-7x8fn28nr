import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HelpCircle, ShieldAlert } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'

export function PatientConsentOverlay() {
  const { user } = useAuth()
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [consents, setConsents] = useState({
    clinical: false,
    risk: false,
    research: false,
    referral: false,
  })

  useEffect(() => {
    if (user?.role === 'paciente') {
      loadPatient()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadPatient = async () => {
    try {
      const records = await pb.collection('patients').getList(1, 1, {
        filter: `profile = "${user.id}"`,
      })
      if (records.items.length > 0) {
        const p = records.items[0]
        setPatient(p)
        setConsents({
          clinical: !!p.consent_clinical_at,
          risk: !!p.consent_risk_at,
          research: !!p.consent_research_at,
          referral: !!p.consent_referral_at,
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const needsConsent = patient && (!patient.consent_clinical_at || patient.first_access === true)

  if (loading || !needsConsent) {
    return null
  }

  const handleSave = async () => {
    if (!consents.clinical) {
      toast({
        title: 'Atenção',
        description: 'É necessário aceitar o consentimento de atendimento clínico para continuar.',
        variant: 'destructive',
      })
      return
    }

    try {
      const now = new Date().toISOString()

      const updateData = {
        consent_clinical_at: consents.clinical ? patient.consent_clinical_at || now : null,
        consent_risk_at: consents.risk ? patient.consent_risk_at || now : null,
        consent_research_at: consents.research ? patient.consent_research_at || now : null,
        consent_referral_at: consents.referral ? patient.consent_referral_at || now : null,
        consent_form_signed: consents.clinical,
        research_consent: consents.research,
        first_access: false,
        portal_permissions: {
          ...(patient.portal_permissions || {}),
          life_protection_consent: consents.risk,
        },
      }

      await pb.collection('patients').update(patient.id, updateData)

      try {
        await pb.collection('audit_logs').create({
          actor: user.id,
          action: 'grant_consent',
          table_name: 'patients',
          record_id: patient.id,
          new_data: { type: 'clinical', status: true },
          ip_address: '0.0.0.0',
          user_agent: navigator.userAgent,
        })
      } catch (e) {
        // Ignora erro no log
      }

      toast({ title: 'Consentimentos salvos com sucesso!' })
      window.location.reload()
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 bg-teal-50 border-b border-teal-100 flex flex-col items-center text-center">
            <ShieldAlert className="h-12 w-12 text-teal-600 mb-4" />
            <h1 className="text-2xl font-bold text-teal-900 mb-2">Bem-vindo ao Syntra!</h1>
            <p className="text-teal-700">
              Antes de começar, precisamos do seu consentimento para algumas questões importantes
              referentes aos seus dados (LGPD).
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <Checkbox
                  checked={consents.clinical}
                  onCheckedChange={(c) => setConsents((s) => ({ ...s, clinical: !!c }))}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      Atendimento Clínico (Obrigatório)
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Permite que a clínica armazene seu prontuário e histórico médico de forma
                        segura.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-slate-500">
                    Autorizo o armazenamento e tratamento dos meus dados para fins de atendimento
                    clínico, conforme a LGPD.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <Checkbox
                  checked={consents.risk}
                  onCheckedChange={(c) => setConsents((s) => ({ ...s, risk: !!c }))}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      Quebra de Sigilo (Recomendado)
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Necessário para utilizar o Diário de Sentimentos no portal.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-slate-500">
                    Autorizo a quebra de sigilo em caso de risco iminente à minha vida ou de
                    terceiros, conforme previsto no Código de Ética do Psicólogo e na LGPD.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <Checkbox
                  checked={consents.research}
                  onCheckedChange={(c) => setConsents((s) => ({ ...s, research: !!c }))}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      Pesquisa Científica (Opcional)
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Seus dados serão completamente anonimizados, sem possibilidade de
                        identificação.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-slate-500">
                    Autorizo o uso anonimizado dos meus dados para fins de pesquisa científica.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <Checkbox
                  checked={consents.referral}
                  onCheckedChange={(c) => setConsents((s) => ({ ...s, referral: !!c }))}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      Encaminhamento (Opcional)
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Agiliza o encaminhamento caso seu psicólogo recomende outro profissional da
                        rede.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-slate-500">
                    Autorizo o compartilhamento dos meus dados anonimizados (idade, queixa
                    principal, especialidade) com outros psicólogos para fins de encaminhamento
                    clínico.
                  </p>
                </div>
              </label>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <Button
                onClick={handleSave}
                className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto"
                disabled={!consents.clinical}
              >
                Salvar Preferências e Continuar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
