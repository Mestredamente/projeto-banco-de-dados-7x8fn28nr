import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { PatientWelcomeTour } from './PatientWelcomeTour'
import { GlobalFeedback } from '@/components/GlobalFeedback'

export default function Layout() {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'paciente' && location.pathname === '/') {
    return <Navigate to="/patient-portal" replace />
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden font-sans">
      <div className="bg-red-500 text-white text-center py-2 px-4 font-bold text-sm shrink-0 flex items-center justify-center gap-2 z-50 shadow-sm">
        <span>🆘 Se estiver em crise, ligue CVV 188</span>
      </div>
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto max-w-6xl">
              <Outlet />
            </div>
            <PatientWelcomeTour />
            <GlobalFeedback />
          </main>
        </div>
      </div>
    </div>
  )
}
