import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SaasBlocker({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    if (!user || user.role === 'paciente' || user.role === 'gestor_saas') return

    pb.collection('subscriptions')
      .getFirstListItem(`subscriber="${user.id}" && status="past_due"`)
      .then((sub) => {
        if (!sub.current_period_end) return
        const dueDate = new Date(sub.current_period_end)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24))

        if (diffDays > 5) {
          setBlocked(true)
        }
      })
      .catch(() => {
        // No past_due subscription found, ignore
      })
  }, [user])

  if (blocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Acesso Suspenso</h1>
        <p className="text-gray-600 mb-8 max-w-lg text-lg">
          Sua assinatura encontra-se com mais de 5 dias de atraso. O acesso da sua clínica e
          profissionais foi temporariamente suspenso por inadiplência.
          <br />
          <br />
          O portal dos seus pacientes continua 100% funcional e acessível para garantir a
          continuidade dos tratamentos.
        </p>
        <Button onClick={signOut} size="lg" className="px-8">
          Sair e Regularizar Assinatura
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
