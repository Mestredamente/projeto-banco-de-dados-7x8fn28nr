import { useAuth } from '@/hooks/use-auth'

export interface ManagerFilter {
  isSaaSAdmin: boolean
  isClinicAdmin: boolean
  clinicIds: string[]
  clinicFilter: string
}

export function useManagerFilter(): ManagerFilter {
  const { user } = useAuth()
  const role = user?.role || ''
  const rawClinics = user?.clinicas_vinculadas
  const clinicIds: string[] = Array.isArray(rawClinics)
    ? rawClinics
    : rawClinics
      ? [rawClinics]
      : []

  const isSaaSAdmin = role === 'gestor_saas'
  const isClinicAdmin = role === 'admin_clinica'

  const clinicFilter =
    !isSaaSAdmin && clinicIds.length > 0 ? clinicIds.map((id) => `clinic="${id}"`).join(' || ') : ''

  return {
    isSaaSAdmin,
    isClinicAdmin,
    clinicIds,
    clinicFilter,
  }
}
