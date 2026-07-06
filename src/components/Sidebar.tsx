import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  FileText,
  Settings,
  DollarSign,
  BarChart2,
  HeartPulse,
  BookOpen,
  GraduationCap,
  Microscope,
  ShieldAlert,
  HelpCircle,
  BellRing,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useProfile } from '@/hooks/use-profile'
import { useBranding } from '@/hooks/use-branding'
import pb from '@/lib/pocketbase/client'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BRAND } from '@/config/branding'

interface SidebarProps {
  collapsed?: boolean
  setCollapsed?: (c: boolean) => void
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { activeProfile, hasPermission } = useProfile()
  const { clinic, systemSettings } = useBranding()

  const ALL_NAV_ITEMS = [
    {
      name: 'Portal do Paciente',
      path: '/patient-portal',
      icon: LayoutDashboard,
      module: 'paciente_portal',
    },
    { name: 'Portal do Gestor', path: '/gestao', icon: ShieldAlert, module: 'gestao_assinantes' },
    {
      name: 'Config. do Sistema',
      path: '/gestao/configuracoes',
      icon: Settings,
      module: 'gestao_assinantes',
    },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
    { name: 'Home da Clínica', path: '/clinica/home', icon: Building2, module: 'gestao_clinica' },
    { name: 'Recepção', path: '/secretaria/home', icon: LayoutDashboard, module: 'dashboard' },
    { name: 'Agenda', path: '/agenda', icon: Calendar, module: 'agenda' },
    {
      name: 'Agendamentos',
      path: '/patient-portal/agenda',
      icon: Calendar,
      module: 'paciente_portal',
    },
    { name: 'Diário', path: '/patient-portal/diary', icon: HeartPulse, module: 'paciente_portal' },
    {
      name: 'Financeiro',
      path: '/patient-portal/financial',
      icon: DollarSign,
      module: 'paciente_portal',
    },
    {
      name: 'Evoluções',
      path: '/patient-portal/evolutions',
      icon: FileText,
      module: 'paciente_portal',
    },
    {
      name: '🔒 Meus Consentimentos',
      path: '/patient-portal/consents',
      icon: ShieldAlert,
      module: 'paciente_portal',
    },
    { name: 'Pacientes', path: '/patients', icon: Users, module: 'pacientes' },
    { name: 'Grupos Terapêuticos', path: '/grupos', icon: Users, module: 'pacientes' },
    { name: '🖥️ Telepsicologia', path: '/telepsicologia', icon: LayoutDashboard, module: 'agenda' },
    { name: 'Prontuário', path: '/notes', icon: FileText, module: 'prontuario' },
    { name: 'Financeiro', path: '/financeiro', icon: DollarSign, module: 'financeiro' },
    { name: 'Relatórios', path: '/reports', icon: BarChart2, module: 'relatorios' },
    { name: 'P&D', path: '/research', icon: Microscope, module: 'pd' },
    { name: 'Academy', path: '/academy', icon: BookOpen, module: 'academy' },
    { name: 'Supervisão', path: '/supervisions', icon: GraduationCap, module: 'supervisao' },
    { name: 'Gestão da Clínica', path: '/clinic-admin', icon: Building2, module: 'gestao_clinica' },
    { name: 'Secretárias', path: '/secretaries', icon: Users, module: 'secretarias' },
    { name: 'Alertas IA', path: '/ai-alerts', icon: BellRing, module: 'dashboard' },
    { name: 'Configurações', path: '/settings', icon: Settings, module: 'configuracoes' },
  ]

  let allowedItems = ALL_NAV_ITEMS.filter((item) => hasPermission(item.module))

  if (activeProfile?.id === 'admin_clinica') {
    allowedItems = allowedItems.filter(
      (i) => i.path !== '/dashboard' && i.path !== '/secretaria/home',
    )
  } else if (activeProfile?.id === 'secretaria') {
    allowedItems = allowedItems.filter(
      (i) =>
        i.path !== '/dashboard' &&
        i.path !== '/clinica/home' &&
        i.path !== '/ai-alerts' &&
        i.path !== '/grupos' &&
        i.path !== '/telepsicologia',
    )
    const homeIdx = allowedItems.findIndex((i) => i.path === '/secretaria/home')
    if (homeIdx !== -1) allowedItems[homeIdx].name = 'Home'
  } else if (
    activeProfile?.id === 'psicologo_autonomo' ||
    activeProfile?.id === 'psicologo_vinculado'
  ) {
    allowedItems = allowedItems.filter(
      (i) => i.path !== '/secretaria/home' && i.path !== '/clinica/home',
    )
  }

  if (activeProfile?.id === 'gestor_saas' || activeProfile?.id === 'paciente') {
    allowedItems = allowedItems.filter((i) => i.path !== '/grupos' && i.path !== '/telepsicologia')
  }

  if (user?.role === 'paciente') {
    allowedItems = allowedItems.filter((i) => i.path !== '/settings')
  }

  allowedItems = allowedItems.filter(
    (item, index, self) => index === self.findIndex((t) => t.path === item.path),
  )

  return (
    <div
      className={cn(
        'bg-[var(--sidebar-bg)] text-white flex flex-col h-full shrink-0 shadow-sm transition-all duration-300 relative z-20',
        collapsed ? 'w-[var(--sidebar-collapsed)]' : 'w-[var(--sidebar-expanded)]',
      )}
    >
      <div
        className={cn(
          'h-[60px] flex items-center border-b border-white/10 transition-all overflow-hidden shrink-0',
          collapsed ? 'justify-center px-0' : 'px-6',
        )}
      >
        {clinic?.logo && !collapsed ? (
          <img
            src={pb.files.getURL(clinic, clinic.logo)}
            alt={clinic.name}
            className="h-8 max-w-full object-contain"
          />
        ) : systemSettings?.logo && !collapsed ? (
          <img
            src={pb.files.getURL(systemSettings, systemSettings.logo)}
            alt={BRAND.nome}
            className="h-[32px] max-w-full object-contain"
          />
        ) : (
          <span className={cn('font-bold text-white truncate', collapsed ? 'text-xl' : 'text-xl')}>
            {collapsed
              ? clinic?.name?.charAt(0) || BRAND.nome.charAt(0)
              : clinic?.name || clinic?.razao_social || BRAND.nome}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar">
        <nav className="space-y-1">
          {allowedItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))

            const linkContent = (
              <Link
                to={item.path}
                className={cn(
                  'flex items-center py-3 text-[14px] font-medium transition-colors duration-200 relative group',
                  collapsed ? 'justify-center px-0' : 'px-6',
                  isActive
                    ? 'bg-[rgba(255,255,255,0.08)] border-l-[3px] border-[var(--color-primary-light)] text-white'
                    : 'text-white/70 hover:bg-[rgba(255,255,255,0.04)] border-l-[3px] border-transparent hover:text-white',
                )}
              >
                <Icon
                  className={cn(
                    'shrink-0 transition-all h-[20px] w-[20px]',
                    collapsed ? '' : 'mr-3',
                    isActive
                      ? 'text-[var(--color-primary-light)]'
                      : 'text-white/50 group-hover:text-white/80',
                  )}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="ml-2 bg-[var(--sidebar-bg)] border-none text-white"
                  >
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              )
            }
            return <div key={item.path}>{linkContent}</div>
          })}
        </nav>
      </div>

      <div
        className={cn(
          'p-4 border-t border-white/10 transition-all flex flex-col gap-2',
          collapsed ? 'items-center px-2' : '',
        )}
      >
        {user?.role !== 'paciente' && (
          <Link
            to="/ajuda"
            className={cn(
              'flex items-center text-[14px] text-white/70 hover:text-white hover:bg-[rgba(255,255,255,0.04)] py-2 rounded-md transition-colors',
              collapsed ? 'justify-center w-10 h-10 p-0' : 'px-2',
            )}
            title={collapsed ? 'Ajuda' : undefined}
          >
            <HelpCircle className={cn('h-[20px] w-[20px]', collapsed ? '' : 'mr-3')} />
            {!collapsed && <span>Ajuda</span>}
          </Link>
        )}
        {!collapsed && <div className="px-2 text-xs text-white/30 mt-2">{BRAND.nome} v1.0.0</div>}
      </div>
    </div>
  )
}
