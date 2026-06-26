import { useBranding } from '@/hooks/use-branding'
import { useAuth } from '@/hooks/use-auth'
import { Settings } from 'lucide-react'

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { systemSettings } = useBranding()
  const { user, isAuthenticated } = useAuth()

  if (systemSettings?.maintenance_mode && isAuthenticated && user?.role !== 'gestor_saas') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 animate-in fade-in duration-500">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center space-y-4">
          <div className="w-16 h-16 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema em Manutenção</h1>
          <p className="text-gray-500">
            {systemSettings?.maintenance_message ||
              'Voltaremos em breve. Estamos realizando melhorias no sistema para melhor atendê-lo.'}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
