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

type ExperienceLevel = 'iniciante' | 'intermediario' | 'avancado' | null

export function WelcomeTour() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [level, setLevel] = useState<ExperienceLevel>(null)
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

  const stepsIniciante = [
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

  const stepsIntermediario = [
    {
      title: 'Bem-vindo de volta à gestão!',
      desc: 'Nosso sistema é direto ao ponto. Aqui você encontra tudo em um só lugar.',
    },
    {
      title: 'Ações Rápidas & Atalhos',
      desc: 'Navegue pelo menu lateral para Agenda, Pacientes e Clínicas. Configure seu perfil em Configurações para emitir recibos automaticamente.',
    },
  ]

  const stepsAvancado = [
    {
      title: 'Boas-vindas!',
      desc: 'Seu ambiente está pronto. Acesse as Configurações para finalizar seu perfil profissional e financeiro e comece a atender.',
    },
  ]

  let currentSteps = stepsIniciante
  if (level === 'intermediario') currentSteps = stepsIntermediario
  if (level === 'avancado') currentSteps = stepsAvancado

  if (!isOpen) return null

  if (level === null) {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleFinish()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-teal-700">
              Olá! Queremos te conhecer melhor.
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Qual seu nível de experiência com sistemas de gestão clínica?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setLevel('iniciante')
                setStep(0)
              }}
            >
              🌱 Iniciante (Gostaria de um tour completo)
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setLevel('intermediario')
                setStep(0)
              }}
            >
              🚀 Intermediário (Conheço o básico, me mostre os atalhos)
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setLevel('avancado')
                setStep(0)
              }}
            >
              ⚡ Avançado (Já sei usar, quero ir direto ao ponto)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleFinish()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-teal-700">{currentSteps[step].title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {currentSteps[step].desc}
          </DialogDescription>
        </DialogHeader>

        {currentSteps.length > 1 && (
          <div className="flex justify-center space-x-2 py-4">
            {currentSteps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${i === step ? 'bg-teal-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        )}

        <DialogFooter>
          {step < currentSteps.length - 1 ? (
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
