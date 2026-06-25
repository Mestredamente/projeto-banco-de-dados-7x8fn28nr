import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useProfile } from '@/hooks/use-profile'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useRef } from 'react'
import { PatientConsentOverlay } from './patients/PatientConsentOverlay'

interface RouteGuardProps {
  allowedModules?: string[]
}

export function RouteGuard({ allowedModules }: RouteGuardProps) {
  const { isAuthenticated, loading, user } = useAuth()
  const { hasPermission, getHomeRoute, activeProfile } = useProfile()
  const { toast } = useToast()
  const location = useLocation()
  const hasAlerted = useRef(false)

  useEffect(() => {
    hasAlerted.current = false
  }, [location.pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        Carregando...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedModules && allowedModules.length > 0) {
    try {
      const hasAccess = allowedModules.some((m) => hasPermission(m))
      if (!hasAccess) {
        if (!hasAlerted.current) {
          hasAlerted.current = true
          setTimeout(() => {
            toast({
              title: 'Acesso Negado',
              description: 'Você não tem permissão para acessar esta página',
              variant: 'destructive',
            })
          }, 100)
        }
        return <Navigate to={getHomeRoute(activeProfile?.id)} replace />
      }
    } catch (error) {
      console.error('Erro na verificação de permissão:', error)
      return <Navigate to={getHomeRoute(activeProfile?.id)} replace />
    }
  }

  if (user?.role === 'paciente') {
    return (
      <>
        <PatientConsentOverlay />
        <Outlet />
      </>
    )
  }

  return <Outlet />
}
