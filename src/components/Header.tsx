import {
  Bell,
  Search,
  UserCircle,
  CheckCircle2,
  AlertTriangle,
  Calendar as CalendarIcon,
  Info,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export function Header() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])

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
      /* intentionally ignored */
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
      /* intentionally ignored */
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

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar pacientes, agendamentos..."
            className="pl-10 bg-gray-50 border-gray-200 focus-visible:ring-teal-500"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-gray-600">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md border-l border-gray-200 dark:border-gray-800 px-0">
            <SheetHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6 border-b">
              <SheetTitle>Notificações</SheetTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-teal-600 h-8"
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
                        !notif.read ? 'bg-teal-50/50 dark:bg-teal-950/20' : 'opacity-70',
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
                              className="h-6 w-6 text-gray-400 hover:text-teal-600 -mr-2"
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
        <div className="flex items-center space-x-2 pl-4 border-l border-gray-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            {user?.name?.charAt(0) || <UserCircle />}
          </div>
        </div>
      </div>
    </header>
  )
}
