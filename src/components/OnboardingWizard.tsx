import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/use-auth'
import { useProfile } from '@/hooks/use-profile'
import pb from '@/lib/pocketbase/client'
import { CheckCircle2, UserPlus, PlayCircle, Settings, PartyPopper } from 'lucide-react'

interface OnboardingWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reviewMode?: boolean
}

export function OnboardingWizard({
  open,
  onOpenChange,
  reviewMode = false,
}: OnboardingWizardProps) {
  const { user } = useAuth()
  const { getHomeRoute, activeProfile } = useProfile()
  const navigate = useNavigate()

  const [step, setStep] = useState<number>(1)
  const [loading, setLoading] = useState(false)

  // Step 2 form
  const [phone, setPhone] = useState('')
  const [specializations, setSpecializations] = useState('')
  const [clinicalApproach, setClinicalApproach] = useState('')

  // Step 4 form
  const [reminders, setReminders] = useState(true)
  const [billingAlerts, setBillingAlerts] = useState(true)

  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!open) {
      setInitialized(false)
    }
  }, [open])

  useEffect(() => {
    if (user && open && !initialized) {
      setStep(reviewMode ? 1 : user.onboarding_step || 1)
      setPhone(user.phone || '')
      setSpecializations(Array.isArray(user.specializations) ? user.specializations.join(', ') : '')
      setClinicalApproach(user.clinical_approach || '')

      pb.collection('notification_settings')
        .getFirstListItem(`user="${user.id}"`)
        .then((settings) => {
          if (settings && settings.triggers) {
            setReminders(settings.triggers.reminders ?? true)
            setBillingAlerts(settings.triggers.billingAlerts ?? true)
          }
        })
        .catch(() => {
          // ignore if no settings found
        })

      setInitialized(true)
    }
  }, [user, open, reviewMode, initialized])

  const saveProgress = async (newStep: number, isComplete: boolean = false) => {
    if (!user) return
    try {
      setLoading(true)
      const data: any = { onboarding_step: newStep }
      if (isComplete || reviewMode) {
        data.onboarding_completed = true
      }

      if (step === 2) {
        data.phone = phone
        data.clinical_approach = clinicalApproach
        data.specializations = specializations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      }

      if (step === 4) {
        try {
          const settings = await pb
            .collection('notification_settings')
            .getFirstListItem(`user="${user.id}"`)
          await pb.collection('notification_settings').update(settings.id, {
            triggers: { reminders, billingAlerts },
          })
        } catch (_) {
          await pb.collection('notification_settings').create({
            user: user.id,
            triggers: { reminders, billingAlerts },
          })
        }
      }

      await pb.collection('users').update(user.id, data)
      if (isComplete) {
        await pb.collection('users').authRefresh()
      }
      setStep(newStep)
      if (isComplete) {
        onOpenChange(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (step < 5) saveProgress(step + 1)
    else saveProgress(5, true)
  }

  const handlePatientRedirect = () => {
    saveProgress(step + 1)
    navigate('/patients/new')
  }

  const handleAgendaRedirect = async () => {
    await saveProgress(5, true)
    onOpenChange(false)
    if (window.location.pathname !== '/patients/new') {
      navigate(getHomeRoute(activeProfile?.id))
    }
  }

  const progressPercentage = (step / 5) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] gap-0 p-0 overflow-hidden outline-none"
        onInteractOutside={(e) => {
          if (!reviewMode && !user?.onboarding_completed) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (!reviewMode && !user?.onboarding_completed) e.preventDefault()
        }}
      >
        <div className="bg-teal-50 dark:bg-teal-950 h-2 w-full">
          <div
            className="bg-teal-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="p-6 md:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-teal-800 dark:text-teal-400">
              {step === 1 && (
                <>
                  <PlayCircle className="h-7 w-7" /> Conheça o Syntra
                </>
              )}
              {step === 2 && (
                <>
                  <Settings className="h-7 w-7" /> Configure seu Perfil
                </>
              )}
              {step === 3 && (
                <>
                  <UserPlus className="h-7 w-7" /> Convide seu Primeiro Paciente
                </>
              )}
              {step === 4 && (
                <>
                  <CheckCircle2 className="h-7 w-7" /> Notificações
                </>
              )}
              {step === 5 && (
                <>
                  <PartyPopper className="h-7 w-7 text-green-600" /> Pronto!
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-[260px] flex flex-col justify-center">
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Olá, <strong>{user?.name?.split(' ')[0] || 'Doutor(a)'}</strong>! O Syntra vai
                  ajudar você a gerenciar sua clínica com mais eficiência e inteligência.
                </p>
                <div className="bg-teal-50 dark:bg-teal-900/10 rounded-xl p-8 flex flex-col items-center justify-center text-center border border-teal-100 dark:border-teal-800">
                  <div className="bg-teal-100 dark:bg-teal-900/30 p-4 rounded-full mb-4">
                    <PlayCircle className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold text-teal-800 dark:text-teal-300 mb-2">
                    📹 Vídeo de boas-vindas em breve
                  </h3>
                  <p className="text-teal-600 dark:text-teal-400/80">
                    O Syntra está preparando um vídeo de boas-vindas para você. Enquanto isso,
                    clique em Próximo para continuar.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <p className="text-gray-600 dark:text-gray-300">
                  Complete suas informações clínicas para que possamos personalizar relatórios e
                  recibos gerados pela plataforma.
                </p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Telefone / WhatsApp Comercial</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="approach">Abordagem Clínica Principal</Label>
                    <Input
                      id="approach"
                      value={clinicalApproach}
                      onChange={(e) => setClinicalApproach(e.target.value)}
                      placeholder="Ex: TCC, Psicanálise, Gestalt..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="specs">Especializações (separadas por vírgula)</Label>
                    <Input
                      id="specs"
                      value={specializations}
                      onChange={(e) => setSpecializations(e.target.value)}
                      placeholder="Ex: Ansiedade, Casais, TDAH..."
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 text-center animate-fade-in">
                <p className="text-gray-600 dark:text-gray-300 text-lg max-w-md mx-auto">
                  O Syntra ganha vida quando você tem pacientes na plataforma. Vamos adicionar o seu
                  primeiro paciente agora mesmo?
                </p>
                <div className="flex justify-center my-4">
                  <div className="bg-teal-50 dark:bg-teal-900/30 w-32 h-32 rounded-full flex items-center justify-center shadow-inner">
                    <UserPlus className="h-14 w-14 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={handlePatientRedirect}
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-md text-base px-8 h-12"
                  >
                    Cadastrar Paciente Agora
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <p className="text-gray-600 dark:text-gray-300">
                  Defina como você deseja que o sistema se comunique com você e com seus pacientes
                  para evitar atrasos e esquecimentos.
                </p>
                <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-5 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="pr-4">
                      <Label className="text-base font-semibold">
                        Lembretes Automáticos de Sessão
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Enviar e-mail de lembrete 24h antes da sessão marcada.
                      </p>
                    </div>
                    <Switch checked={reminders} onCheckedChange={setReminders} />
                  </div>
                  <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />
                  <div className="flex items-center justify-between">
                    <div className="pr-4">
                      <Label className="text-base font-semibold">Alertas Financeiros</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Receber avisos diários sobre pendências e mensalidades a vencer.
                      </p>
                    </div>
                    <Switch checked={billingAlerts} onCheckedChange={setBillingAlerts} />
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6 text-center animate-fade-in">
                <div className="flex justify-center mb-2">
                  <div className="bg-green-100 dark:bg-green-900/30 w-28 h-28 rounded-full flex items-center justify-center animate-bounce">
                    <PartyPopper className="h-14 w-14 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                {reviewMode ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      🎉 Onboarding revisado com sucesso.
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 text-lg max-w-sm mx-auto">
                      Suas configurações foram atualizadas.
                    </p>
                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={() => {
                          onOpenChange(false)
                          navigate('/')
                        }}
                        size="lg"
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 shadow-md"
                      >
                        Voltar ao Dashboard
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      🎉 Você concluiu o onboarding!
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 text-lg max-w-sm mx-auto">
                      Agora é só explorar o Syntra. Seu ambiente clínico digital está 100% pronto
                      para alavancar seus atendimentos.
                    </p>
                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={handleAgendaRedirect}
                        size="lg"
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 shadow-md"
                      >
                        Que tal agendar sua primeira sessão?
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-5 flex items-center justify-between sm:justify-between w-full">
            {step === 3 ? (
              <Button
                variant="ghost"
                onClick={handleNext}
                disabled={loading}
                className="text-gray-500 w-full sm:w-auto"
              >
                Pular por enquanto
              </Button>
            ) : step < 5 ? (
              <div className="flex w-full justify-between items-center">
                <div className="text-sm font-medium text-teal-600 dark:text-teal-400">
                  Etapa {step} de 5
                </div>
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8"
                >
                  {loading ? 'Salvando...' : step === 1 ? 'Próximo' : 'Avançar'}
                </Button>
              </div>
            ) : (
              <Button onClick={handleAgendaRedirect} variant="ghost" className="w-full sm:w-auto">
                Fechar Assistente
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
