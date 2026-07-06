import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'

export function PatientWelcomeTour() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)

  const isPatient = user?.role === 'paciente'

  useEffect(() => {
    if (isPatient && user && !user.last_login_at) {
      setIsOpen(true)
    }
  }, [user, isPatient])

  const handleFinish = async () => {
    try {
      await pb.collection('users').update(user.id, {
        last_login_at: new Date().toISOString(),
      })
      setIsOpen(false)
    } catch (e) {
      console.error('Failed to update last_login_at', e)
      setIsOpen(false)
    }
  }

  const patientSteps = [
    {
      title: 'Bem-vindo ao Syntra',
      desc: 'Bem-vindo ao Syntra. Aqui você acompanha suas sessões e muito mais.',
    },
    {
      title: 'Agendamentos',
      desc: 'Na aba Agendamentos, você vê suas próximas sessões e pode solicitar mudanças.',
    },
    {
      title: 'Diário de Sentimentos',
      desc: 'No Diário de Sentimentos, você registra como está se sentindo entre as sessões.',
    },
    { title: 'Financeiro', desc: 'Seus recibos ficam disponíveis na aba Financeiro.' },
    {
      title: 'Emergências',
      desc: 'Em caso de crise ou emergência, ligue para o CVV (188) para apoio emocional ou SAMU (192) para emergências médicas. Você não está só.',
    },
    {
      title: 'Pronto!',
      desc: `Que bom ter você aqui, ${user?.name?.split(' ')[0] || ''}! Conte com o Syntra para cuidar da sua jornada.`,
    },
  ]

  if (!isOpen || !isPatient) return null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleFinish()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-teal-700">{patientSteps[step].title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {patientSteps[step].desc}
          </DialogDescription>
        </DialogHeader>

        {patientSteps.length > 1 && (
          <div className="flex justify-center space-x-2 py-4">
            {patientSteps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${i === step ? 'bg-teal-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        )}

        <DialogFooter>
          {step < patientSteps.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              className="bg-teal-600 hover:bg-teal-700 text-white w-full"
            >
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="bg-teal-600 hover:bg-teal-700 text-white w-full"
            >
              Começar a usar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
