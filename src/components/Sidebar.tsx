import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  FileText,
  Settings,
  LogOut,
  DollarSign,
  BarChart2,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { usePatient } from '@/hooks/use-patient'
import { Button } from '@/components/ui/button'
import { HeartPulse, BookOpen, GraduationCap, ArrowRightLeft } from 'lucide-react'

const NAV_ITEMS_PSICO = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Agenda', path: '/agenda', icon: Calendar },
  { name: 'Pacientes', path: '/patients', icon: Users },
  { name: 'Clínicas', path: '/clinics', icon: Building2 },
  { name: 'Financeiro', path: '/financeiro', icon: DollarSign },
  { name: 'Prontuários', path: '/notes', icon: FileText },
  { name: 'Relatórios', path: '/reports', icon: BarChart2 },
  { name: 'Syntra Academy', path: '/academy', icon: BookOpen },
  { name: 'Supervisões', path: '/supervisions', icon: GraduationCap },
  { name: 'Encaminhamentos', path: '/referrals', icon: ArrowRightLeft },
  { name: 'Configurações', path: '/settings', icon: Settings },
]

export function Sidebar() {
  const { pathname } = useLocation()
  const { signOut, user } = useAuth()
  const { patient } = usePatient()

  const isPatient = user?.role === 'paciente'
  const isSecretary = user?.role === 'secretaria'
  const perms = patient?.portal_permissions || { diary: true, financial: true, evolutions: true }

  const NAV_ITEMS = isPatient
    ? [
        { name: 'Dashboard', path: '/patient-portal', icon: LayoutDashboard },
        { name: 'Agendamentos', path: '/patient-portal/agenda', icon: Calendar },
        ...(perms.diary
          ? [{ name: 'Diário de Sentimentos', path: '/patient-portal/diary', icon: HeartPulse }]
          : []),
        ...(perms.financial
          ? [{ name: 'Financeiro', path: '/patient-portal/financial', icon: DollarSign }]
          : []),
        ...(perms.evolutions
          ? [{ name: 'Evoluções', path: '/patient-portal/evolutions', icon: FileText }]
          : []),
        { name: 'Configurações', path: '/settings', icon: Settings },
      ]
    : isSecretary
      ? NAV_ITEMS_SEC
      : NAV_ITEMS_PSICO

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shrink-0 shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
        <span className="text-xl font-bold text-teal-600 dark:text-teal-400">PsicoManager</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-200',
                  isActive
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                )}
              >
                <Icon
                  className={cn(
                    'mr-3 h-5 w-5',
                    isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400',
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={signOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  )
}
