import { Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { OnboardingWizard } from './OnboardingWizard'
import { useEffect, useState } from 'react'

export function OnboardingGuard() {
  const { user, loading } = useAuth()
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    if (!loading && user && user.onboarding_completed === false) {
      setShowWizard(true)
    } else {
      setShowWizard(false)
    }
  }, [user, loading])

  if (loading) return null

  if (showWizard) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 flex items-center justify-center">
        <OnboardingWizard open={true} onOpenChange={() => {}} />
      </div>
    )
  }

  return <Outlet />
}
