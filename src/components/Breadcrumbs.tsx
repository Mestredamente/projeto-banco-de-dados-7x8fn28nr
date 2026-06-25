import { Link, useLocation } from 'react-router-dom'

const routeNames: Record<string, string> = {
  agenda: 'Agenda',
  patients: 'Pacientes',
  new: 'Novo',
  edit: 'Editar',
  clinics: 'Clínicas',
  financeiro: 'Financeiro',
  notes: 'Prontuário',
  reports: 'Relatórios',
  settings: 'Configurações',
  secretaries: 'Secretárias',
  'clinic-admin': 'Gestão da Clínica',
  referrals: 'Encaminhamentos',
  supervisions: 'Supervisão',
  research: 'P&D',
  academy: 'Academy',
  'ai-alerts': 'Alertas IA',
  ajuda: 'Ajuda',
  saas: 'Portal do Gestor',
  'patient-portal': 'Portal do Paciente',
  diary: 'Diário',
  evolutions: 'Evoluções',
}

export function Breadcrumbs() {
  const location = useLocation()
  const paths = location.pathname.split('/').filter(Boolean)

  if (paths.length === 0) return null

  return (
    <nav className="hidden md:flex items-center space-x-2 text-[14px]">
      <Link
        to="/"
        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        Home
      </Link>
      {paths.map((path, index) => {
        const isLast = index === paths.length - 1
        const routeTo = `/${paths.slice(0, index + 1).join('/')}`
        const label = routeNames[path] || path

        return (
          <div key={path} className="flex items-center space-x-2">
            <span className="text-[var(--color-text-disabled)]">/</span>
            {isLast ? (
              <span className="text-[var(--color-text-primary)] font-medium capitalize">
                {label}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors capitalize"
              >
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
