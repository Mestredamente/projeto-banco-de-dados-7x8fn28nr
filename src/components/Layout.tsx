import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { PatientWelcomeTour } from './PatientWelcomeTour'
import { GlobalFeedback } from '@/components/GlobalFeedback'

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-[var(--color-background)] overflow-hidden font-sans">
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
          <main className="flex-1 overflow-y-auto p-[var(--spacing-lg)]">
            <div className="mx-auto max-w-[1200px] w-full h-full">
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
