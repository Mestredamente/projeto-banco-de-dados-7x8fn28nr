import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './use-auth'

export const ROLES = {
  PSICOLOGO_AUTONOMO: 'psicologo_autonomo',
  PSICOLOGO_VINCULADO: 'psicologo_vinculado',
  ADMIN_CLINICA: 'admin_clinica',
  SECRETARIA: 'secretaria',
  ADMIN_SYNTRA: 'gestor_saas',
  PACIENTE: 'paciente',
} as const

export const ROLE_DEFINITIONS = {
  [ROLES.PSICOLOGO_AUTONOMO]: {
    id: ROLES.PSICOLOGO_AUTONOMO,
    label: 'Psicólogo Autônomo',
    description: 'Profissional atuando de forma independente',
    homeRoute: '/dashboard',
  },
  [ROLES.PSICOLOGO_VINCULADO]: {
    id: ROLES.PSICOLOGO_VINCULADO,
    label: 'Psicólogo Vinculado',
    description: 'Profissional vinculado a uma clínica',
    homeRoute: '/dashboard',
  },
  [ROLES.ADMIN_CLINICA]: {
    id: ROLES.ADMIN_CLINICA,
    label: 'Administrador da Clínica',
    description: 'Gestor da clínica com acesso a todos os recursos',
    homeRoute: '/clinica/home',
  },
  [ROLES.SECRETARIA]: {
    id: ROLES.SECRETARIA,
    label: 'Secretária',
    description: 'Responsável pelo atendimento e agenda',
    homeRoute: '/secretaria/home',
  },
  [ROLES.ADMIN_SYNTRA]: {
    id: ROLES.ADMIN_SYNTRA,
    label: 'Administrador Syntra',
    description: 'Gestor da plataforma Syntra',
    homeRoute: '/gestao/dashboard',
  },
  [ROLES.PACIENTE]: {
    id: ROLES.PACIENTE,
    label: 'Paciente',
    description: 'Paciente da clínica',
    homeRoute: '/patient-portal',
  },
}

export const PROFILE_PERMISSIONS = {
  [ROLES.PSICOLOGO_AUTONOMO]: [
    'dashboard',
    'agenda',
    'pacientes',
    'prontuario',
    'financeiro',
    'relatorios',
    'pd',
    'academy',
    'supervisao',
    'configuracoes',
  ],
  [ROLES.PSICOLOGO_VINCULADO]: [
    'dashboard',
    'agenda',
    'pacientes',
    'prontuario',
    'financeiro',
    'relatorios',
    'academy',
    'supervisao',
    'configuracoes',
  ],
  [ROLES.ADMIN_CLINICA]: [
    'dashboard',
    'agenda',
    'pacientes',
    'prontuario',
    'financeiro',
    'relatorios',
    'gestao_clinica',
    'profissionais',
    'salas',
    'estoque',
    'secretarias',
    'academy',
    'configuracoes',
  ],
  [ROLES.SECRETARIA]: ['dashboard', 'agenda', 'pacientes', 'financeiro', 'ponto_eletronico'],
  [ROLES.ADMIN_SYNTRA]: ['gestao_assinantes', 'planos', 'cupons', 'auditoria', 'health_check'],
  [ROLES.PACIENTE]: ['paciente_portal', 'configuracoes'],
}

interface ProfileContextType {
  activeProfile: (typeof ROLE_DEFINITIONS)[keyof typeof ROLE_DEFINITIONS] | null
  switchContext: (role: string) => void
  userRoles: string[]
  hasPermission: (module: string) => boolean
  getHomeRoute: (role?: string) => string
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export const useProfile = () => {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile deve ser usado dentro de um ProfileProvider')
  return context
}

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [activeRole, setActiveRole] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role && activeRole === null) {
      setActiveRole(user.role)
    }
  }, [user, activeRole])

  const userRoles =
    user?.role === ROLES.ADMIN_CLINICA
      ? [ROLES.ADMIN_CLINICA, ROLES.PSICOLOGO_VINCULADO]
      : user?.role
        ? [user.role]
        : []

  const switchContext = (role: string) => {
    try {
      if (userRoles.includes(role)) {
        setActiveRole(role)
      } else {
        throw new Error('Você não tem permissão para assumir este perfil.')
      }
    } catch (error: any) {
      console.error(error.message)
      throw error
    }
  }

  const hasPermission = (module: string) => {
    if (!activeRole) return false
    try {
      const perms = PROFILE_PERMISSIONS[activeRole as keyof typeof PROFILE_PERMISSIONS] || []
      return perms.includes(module)
    } catch {
      return false
    }
  }

  const getHomeRoute = (role?: string) => {
    try {
      const targetRole = role || activeRole
      if (!targetRole) return '/'
      return ROLE_DEFINITIONS[targetRole as keyof typeof ROLE_DEFINITIONS]?.homeRoute || '/'
    } catch {
      return '/'
    }
  }

  const activeProfile = activeRole
    ? ROLE_DEFINITIONS[activeRole as keyof typeof ROLE_DEFINITIONS]
    : null

  return (
    <ProfileContext.Provider
      value={{
        activeProfile,
        switchContext,
        userRoles,
        hasPermission,
        getHomeRoute,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}
