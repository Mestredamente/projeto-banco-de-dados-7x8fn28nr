import {
  Bell,
  UserCircle,
  CheckCircle2,
  AlertTriangle,
  Calendar as CalendarIcon,
  Info,
  Menu,
  Building2,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useProfile, ROLE_DEFINITIONS } from '@/hooks/use-profile'
import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Link, useNavigate } from 'react-router-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Breadcrumbs } from './Breadcrumbs'
import { useBranding } from '@/hooks/use-branding'
import { BRAND } from '@/config/branding'

interface HeaderProps {
  sidebarCollapsed?: boolean
  setSidebarCollapsed?: (c: boolean) => void
}

export function Header({ sidebarCollapsed, setSidebarCollapsed }: HeaderProps) {
  const { user, signOut } = useAuth()
  const { activeProfile, userRoles, switchContext, getHomeRoute } = useProfile()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<any[]>([])
  const { systemSettings } = useBranding()

  const loadNotifications = async () => {
    if (!user) return
    try {
      const records = await pb.collection('notifications').getList(1, 50, {
        filter: `profile = "${user.id}"`,
        sort: '-created',
      })
      setNotifications(records.items)
    } catch (e) {
      console.error('Failed to load notifications', e)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user])

  useRealtime(
    'notifications',
    () => {
      loadNotifications()
    },
    !!user,
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = async (id: string) => {
    try {
      await pb
        .collection('notifications')
        .update(id, { read: true, read_at: new Date().toISOString() })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch {
      // intentionally ignored
    }
  }

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read)
      await Promise.all(
        unread.map((n) =>
          pb
            .collection('notifications')
            .update(n.id, { read: true, read_at: new Date().toISOString() }),
        ),
      )
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // intentionally ignored
    }
  }

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'alerta_risco':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'retorno':
        return <CalendarIcon className="h-4 w-4 text-blue-500" />
      case 'cobranca':
        return <Info className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const handleRoleChange = (role: string) => {
    switchContext(role)
    navigate(getHomeRoute(role))
  }

  const showContextSelector = userRoles.length > 1

  return (
    <header className="h-[60px] bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 shrink-0 z-10 transition-all duration-300">
      <div className="flex items-center gap-3 md:gap-5 flex-1 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed?.(!sidebarCollapsed)}
          className="shrink-0 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {systemSettings?.logo && (
          <img
            src={pb.files.getURL(systemSettings, systemSettings.logo)}
            alt={BRAND.nome}
            className="h-6 object-contain lg:hidden shrink-0"
          />
        )}

        <div className="hidden lg:block">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
        <Badge
          variant="secondary"
          className="hidden lg:inline-flex capitalize shrink-0 bg-primary/10 text-primary hover:bg-primary/20"
        >
          {activeProfile?.label || user?.role?.replace('_', ' ')}
        </Badge>

        {showContextSelector && (
          <div className="hidden sm:flex items-center gap-2 max-w-[200px] xl:max-w-[300px]">
            <span className="text-[14px] font-medium text-gray-500 whitespace-nowrap hidden xl:inline">
              Perfil:
            </span>
            <Select value={activeProfile?.id} onValueChange={handleRoleChange}>
              <SelectTrigger className="h-8 text-xs border-dashed bg-gray-50 hover:bg-gray-100 transition-colors w-full focus:ring-1">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {userRoles.map((role) => {
                  const def = ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]
                  if (!def) return null
                  return (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        {role === 'admin_clinica' ? (
                          <Building2 className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        {def.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-600 hover:bg-gray-100 rounded-full h-9 w-9"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md border-l border-[var(--color-border)] px-0">
            <SheetHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6 border-b">
              <SheetTitle>Notificações</SheetTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-primary h-8"
                >
                  Marcar todas como lidas
                </Button>
              )}
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-5rem)]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Nenhuma notificação encontrada.
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'flex items-start gap-3 p-4 border-b last:border-0 transition-colors',
                        !notif.read ? 'bg-primary/5 dark:bg-primary/10' : 'opacity-70',
                      )}
                    >
                      <div className="mt-1 bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm border shrink-0">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {notif.body}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-gray-400">
                            {formatDistanceToNow(new Date(notif.created), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                          {!notif.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-primary -mr-2"
                              onClick={() => markAsRead(notif.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-[32px] w-[32px] rounded-full focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 p-0 overflow-hidden"
            >
              <div className="h-full w-full rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
                {user?.name?.charAt(0) || <UserCircle className="h-5 w-5" />}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 mt-1 shadow-lg border-gray-100 dark:border-gray-800"
          >
            <DropdownMenuLabel className="p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate text-gray-900 dark:text-gray-100">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              asChild
              className="cursor-pointer py-2 px-3 focus:bg-gray-50 dark:focus:bg-gray-800"
            >
              <Link to="/settings">Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="cursor-pointer py-2 px-3 focus:bg-gray-50 dark:focus:bg-gray-800"
            >
              <Link to="/settings">Configurações</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer py-2 px-3 font-medium"
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
