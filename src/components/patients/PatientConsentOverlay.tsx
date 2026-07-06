import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HelpCircle, ShieldAlert } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'

interface Patient {
  id: string
  consent_clinical_at?: string | null
  consent_breach_at?: string | null
  consent_risk_at?: string | null
  consent_research_at?: string | null
  consent_referral_at?: string | null
  portal_permissions?: Record<string, any> | null
  [key: string]: any
}

interface PatientConsentOverlayProps {
  patient: Patient | null | undefined
  onClose?: () => void
  onComplete?: (updatedPatient: any) => void
}

export function PatientConsentOverlay({
  patient,
  onClose,
  onComplete,
}: PatientConsentOverlayProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [consentData, setConsentData] = useState({
    clinical: false,
    breach: false,
    research: false,
    referral: false,
  })

  useEffect(() => {
    if (patient) {
      setConsentData({
        clinical: patient.consent_clinical_at ? true : false,
        breach: patient.consent_breach_at || patient.consent_risk_at ? true : false,
        research: patient.consent_research_at ? true : false,
        referral: patient.consent_referral_at ? true : false,
      })
    }
  }, [patient])

  if (!patient) {
    return null
  }

  const handleSave = async () => {
    if (!consentData.clinical) {
      toast({
        title: 'Atenção',
        description: 'É necessário aceitar o consentimento de atendimento clínico para continuar.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const now = new Date().toISOString()
      const breachDate = patient.consent_breach_at || patient.consent_risk_at

      const updateData: Record<string, any> = {
        consent_clinical_at: consentData.clinical ? patient.consent_clinical_at || now : null,
        consent_risk_at: consentData.breach ? breachDate || now : null,
        consent_research_at: consentData.research ? patient.consent_research_at || now : null,
        consent_referral_at: consentData.referral ? patient.consent_referral_at || now : null,
        consent_form_signed: consentData.clinical,
        research_consent: consentData.research,
        first_access: false,
        portal_permissions: {
          ...(patient.portal_permissions || {}),
          life_protection_consent: consentData.breach,
        },
      }

      const updated = await pb.collection('patients').update(patient.id, updateData)

      try {
        await pb.collection('audit_logs').create({
          actor: user?.id || '',
          action: 'grant_consent',
          table_name: 'patients',
          record_id: patient.id,
          new_data: {
            clinical: consentData.clinical,
            breach: consentData.breach,
            research: consentData.research,
            referral: consentData.referral,
          },
          ip_address: '0.0.0.0',
          user_agent: navigator.userAgent,
        })
      } catch {
        // Audit log failure should not block the user
      }

      toast({ title: 'Consentimentos salvos com sucesso!' })
      if (onComplete) {
        onComplete(updated)
      }
      if (onClose) {
        onClose()
      }
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const consentItems = [
    {
      key: 'clinical' as const,
      label: 'Atendimento Clínico (Obrigatório)',
      tooltip: 'Permite que a clínica armazene seu prontuário e histórico médico de forma segura.',
      text: 'Autorizo o armazenamento e tratamento dos meus dados para fins de atendimento clínico, conforme a LGPD.',
    },
    {
      key: 'breach' as const,
      label: 'Quebra de Sigilo (Recomendado)',
      tooltip: 'Necessário para utilizar o Diário de Sentimentos no portal.',
      text: 'Autorizo a quebra de sigilo em caso de risco iminente à minha vida ou de terceiros, conforme previsto no Código de Ética do Psicólogo e na LGPD.',
    },
    {
      key: 'research' as const,
      label: 'Pesquisa Científica (Opcional)',
      tooltip: 'Seus dados serão completamente anonimizados, sem possibilidade de identificação.',
      text: 'Autorizo o uso anonimizado dos meus dados para fins de pesquisa científica.',
    },
    {
      key: 'referral' as const,
      label: 'Encaminhamento (Opcional)',
      tooltip: 'Agiliza o encaminhamento caso seu psicólogo recomende outro profissional da rede.',
      text: 'Autorizo o compartilhamento dos meus dados anonimizados (idade, queixa principal, especialidade) com outros psicólogos para fins de encaminhamento clínico.',
    },
  ]

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
        style={{ zIndex: 99 }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
        style={{ zIndex: 100 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-fade-in-up">
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
              {consentItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                  onClick={() => setConsentData((s) => ({ ...s, [item.key]: !s[item.key] }))}
                >
                  <Checkbox
                    checked={consentData[item.key]}
                    onCheckedChange={(c) => setConsentData((s) => ({ ...s, [item.key]: !!c }))}
                    className="mt-1 pointer-events-auto"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{item.label}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-slate-400" />
                        </TooltipTrigger>
                        <TooltipContent>{item.tooltip}</TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm text-slate-500">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
              <Button
                onClick={handleSave}
                className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto min-w-[200px] h-12 text-base"
                disabled={!consentData.clinical || loading}
              >
                {loading ? 'Salvando...' : 'Salvar Preferências e Continuar'}
              </Button>
              {!consentData.clinical && (
                <p className="text-rose-500 text-sm font-medium text-center">
                  É necessário aceitar o consentimento de atendimento clínico para continuar.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
