import { useAuth } from '@/hooks/use-auth'

export interface FinancialFilterOptions {
  professionalId: string
  clinicId: string
  isAdminRole?: boolean
}

export function useFinancialFilter(): FinancialFilterOptions {
  const { user } = useAuth()
  const professionalId = user?.id || ''
  const clinicId = (user?.contexto_ativo as string) || ''
  const isAdminRole =
    user?.role === 'admin_clinica' || user?.role === 'gestor_saas' || user?.role === 'secretaria'

  return { professionalId, clinicId, isAdminRole }
}
