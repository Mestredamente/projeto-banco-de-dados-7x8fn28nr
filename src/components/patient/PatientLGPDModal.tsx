import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ShieldCheck, Info, CheckCircle2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import pb from '@/lib/pocketbase/client'
import { toast } from '@/hooks/use-toast'

interface PatientLGPDModalProps {
  patient: any
  onComplete: (updatedPatient: any) => void
}

export function PatientLGPDModal({ patient, onComplete }: PatientLGPDModalProps) {
  const [loading, setLoading] = useState(false)
  const [consents, setConsents] = useState({
    clinical: !!patient.consent_clinical_at,
    risk: !!patient.consent_risk_at,
    research: !!patient.consent_research_at,
    referral: !!patient.consent_referral_at,
  })

  const handleSubmit = async () => {
    if (!consents.clinical) {
      toast({
        title: 'Consentimento Necessário',
        description: 'É necessário aceitar o consentimento de atendimento clínico para continuar.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const now = new Date().toISOString()

      const newHistory = [
        { action: 'Aceito', type: 'Atendimento Clínico', date: now },
        ...(consents.risk ? [{ action: 'Aceito', type: 'Quebra de Sigilo', date: now }] : []),
        ...(consents.research
          ? [{ action: 'Aceito', type: 'Pesquisa Científica', date: now }]
          : []),
        ...(consents.referral ? [{ action: 'Aceito', type: 'Encaminhamento', date: now }] : []),
      ]

      const data = {
        primeiro_acesso_portal: false,
        consent_clinical_at: consents.clinical ? now : null,
        consent_risk_at: consents.risk ? now : null,
        consent_research_at: consents.research ? now : null,
        consent_referral_at: consents.referral ? now : null,
        consent_form_signed: consents.clinical,
        research_consent: consents.research,
        consent_history: [...(patient.consent_history || []), ...newHistory],
        portal_permissions: {
          ...(patient.portal_permissions || {}),
          life_protection_consent: consents.risk,
        },
      }

      const updated = await pb.collection('patients').update(patient.id, data)
      toast({ title: 'Preferências salvas com sucesso' })
      onComplete(updated)
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-fade-in-up my-auto">
        <div className="bg-teal-600 p-6 sm:p-8 rounded-t-2xl text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Bem-vindo ao Syntra!</h2>
          </div>
          <p className="text-teal-50 text-lg">
            Antes de começar, precisamos do seu consentimento para algumas questões importantes
            relacionadas aos seus dados.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-5">
            {/* Consent 1: Clinical (Required) */}
            <div className="flex items-start space-x-4 p-4 rounded-xl border border-slate-200 bg-slate-50 transition-colors hover:border-teal-200">
              <Checkbox
                id="c-clinical"
                checked={consents.clinical}
                onCheckedChange={(v) => setConsents({ ...consents, clinical: !!v })}
                className="mt-1 h-5 w-5 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
              />
              <div className="space-y-1 w-full">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="c-clinical"
                    className="text-base font-semibold text-slate-900 cursor-pointer"
                  >
                    Atendimento Clínico <span className="text-rose-500">*</span>
                  </label>
                  <Tooltip>
                    <TooltipTrigger type="button" className="cursor-help">
                      <Info className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Consentimento fundamental para que a clínica possa armazenar seu prontuário e
                      dados básicos.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p
                  className="text-sm text-slate-600 leading-relaxed cursor-pointer"
                  onClick={() => setConsents({ ...consents, clinical: !consents.clinical })}
                >
                  Autorizo o armazenamento e tratamento dos meus dados para fins de atendimento
                  clínico, conforme a LGPD.
                </p>
              </div>
            </div>

            {/* Consent 2: Risk (Optional/Diary) */}
            <div className="flex items-start space-x-4 p-4 rounded-xl border border-slate-200 bg-white transition-colors hover:border-teal-200">
              <Checkbox
                id="c-risk"
                checked={consents.risk}
                onCheckedChange={(v) => setConsents({ ...consents, risk: !!v })}
                className="mt-1 h-5 w-5 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
              />
              <div className="space-y-1 w-full">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="c-risk"
                    className="text-base font-semibold text-slate-900 cursor-pointer"
                  >
                    Quebra de Sigilo (Risco)
                  </label>
                  <Tooltip>
                    <TooltipTrigger type="button" className="cursor-help">
                      <Info className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Necessário para utilizar o Diário de Sentimentos no portal.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p
                  className="text-sm text-slate-600 leading-relaxed cursor-pointer"
                  onClick={() => setConsents({ ...consents, risk: !consents.risk })}
                >
                  Autorizo a quebra de sigilo em caso de risco iminente à minha vida ou de
                  terceiros, conforme previsto no Código de Ética do Psicólogo e na LGPD.
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
                  <Info className="h-3.5 w-3.5" />
                  Necessário para habilitar o Diário de Sentimentos
                </div>
              </div>
            </div>

            {/* Consent 3: Research (Optional) */}
            <div className="flex items-start space-x-4 p-4 rounded-xl border border-slate-200 bg-white transition-colors hover:border-teal-200">
              <Checkbox
                id="c-research"
                checked={consents.research}
                onCheckedChange={(v) => setConsents({ ...consents, research: !!v })}
                className="mt-1 h-5 w-5 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
              />
              <div className="space-y-1 w-full">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="c-research"
                    className="text-base font-semibold text-slate-900 cursor-pointer"
                  >
                    Pesquisa Científica{' '}
                    <span className="text-slate-400 font-normal text-sm">(Opcional)</span>
                  </label>
                  <Tooltip>
                    <TooltipTrigger type="button" className="cursor-help">
                      <Info className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Seus dados são completamente anonimizados antes de qualquer uso estatístico.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p
                  className="text-sm text-slate-600 leading-relaxed cursor-pointer"
                  onClick={() => setConsents({ ...consents, research: !consents.research })}
                >
                  Autorizo o uso anonimizado dos meus dados para fins de pesquisa científica.
                </p>
              </div>
            </div>

            {/* Consent 4: Referral (Optional) */}
            <div className="flex items-start space-x-4 p-4 rounded-xl border border-slate-200 bg-white transition-colors hover:border-teal-200">
              <Checkbox
                id="c-referral"
                checked={consents.referral}
                onCheckedChange={(v) => setConsents({ ...consents, referral: !!v })}
                className="mt-1 h-5 w-5 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
              />
              <div className="space-y-1 w-full">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="c-referral"
                    className="text-base font-semibold text-slate-900 cursor-pointer"
                  >
                    Encaminhamento Clínico{' '}
                    <span className="text-slate-400 font-normal text-sm">(Opcional)</span>
                  </label>
                  <Tooltip>
                    <TooltipTrigger type="button" className="cursor-help">
                      <Info className="h-4 w-4 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Permite que seu profissional compartilhe um resumo anônimo com colegas caso
                      precise te encaminhar.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p
                  className="text-sm text-slate-600 leading-relaxed cursor-pointer"
                  onClick={() => setConsents({ ...consents, referral: !consents.referral })}
                >
                  Autorizo o compartilhamento dos meus dados anonimizados (idade, queixa principal,
                  especialidade) com outros psicólogos para fins de encaminhamento clínico.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="w-full sm:w-auto min-w-[200px] bg-teal-600 hover:bg-teal-700 text-white shadow-md text-base h-12"
              onClick={handleSubmit}
              disabled={loading || !consents.clinical}
            >
              {loading ? 'Salvando...' : 'Salvar Preferências'}
            </Button>
            {!consents.clinical && (
              <p className="text-rose-500 text-sm font-medium animate-fade-in text-center">
                É necessário aceitar o consentimento de atendimento clínico para continuar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
