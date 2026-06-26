import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (data: any) => Promise<{ error: any }>
  signOut: () => void
  requestPasswordReset: (email: string) => Promise<{ error: any }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.isValid ? pb.authStore.record : null)
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(pb.authStore.isValid ? record : null)
      setIsAuthenticated(pb.authStore.isValid)
    })

    let refreshInterval: ReturnType<typeof setInterval>

    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .catch(() => pb.authStore.clear())
        .finally(() => setLoading(false))

      refreshInterval = setInterval(
        () => {
          if (pb.authStore.isValid) {
            pb.collection('users')
              .authRefresh()
              .catch(() => pb.authStore.clear())
          }
        },
        5 * 60 * 1000,
      ) // 5 minutes
    } else {
      if (pb.authStore.record) pb.authStore.clear()
      setLoading(false)
    }

    return () => {
      unsubscribe()
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [])

  const signUp = async (data: any) => {
    try {
      await pb.collection('users').create({
        email: data.email,
        password: data.password,
        passwordConfirm: data.passwordConfirm || data.password,
        name: data.name,
        role: data.role,
        cpf: data.cpf,
        crp: data.crp,
        phone: data.phone,
        terms_accepted_at: data.acceptedTerms ? new Date().toISOString() : null,
        consent_given_at: data.acceptedLgpd ? new Date().toISOString() : null,
        emailVisibility: true,
        clinic_name: data.clinic_name, // Extra field handled by user_onboarding hook
        is_active: true,
      })
      await pb.collection('users').authWithPassword(data.email, data.password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
  }

  const requestPasswordReset = async (email: string) => {
    try {
      await pb.collection('users').requestPasswordReset(email)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
