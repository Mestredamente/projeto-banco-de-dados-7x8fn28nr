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

export function WelcomeTour() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (user && !user.last_login_at) {
      setIsOpen(true)
    }
  }, [user])

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

  const steps = [
    {
      title: 'Bem-vindo ao Sistema!',
      desc: 'Nós preparamos um ambiente completo para a gestão da sua prática clínica. Vamos conhecer as principais áreas?',
    },
    {
      title: 'Agenda Inteligente',
      desc: 'Controle seus horários, agendamentos e status das sessões de forma simples e rápida.',
    },
    {
      title: 'Prontuários e Pacientes',
      desc: 'Mantenha o histórico, as anotações e os dados sensíveis dos seus pacientes protegidos e organizados.',
    },
    {
      title: 'Perfil Profissional',
      desc: 'Acesse a aba de Configurações para preencher suas especializações, abordagens e chave Pix.',
    },
  ]

  if (!isOpen) return null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleFinish()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-teal-700">{steps[step].title}</DialogTitle>
          <DialogDescription className="text-base mt-2">{steps[step].desc}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center space-x-2 py-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${i === step ? 'bg-teal-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <DialogFooter>
          {step < steps.length - 1 ? (
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
