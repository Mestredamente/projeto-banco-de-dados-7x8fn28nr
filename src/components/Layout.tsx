import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'

export default function Layout() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
