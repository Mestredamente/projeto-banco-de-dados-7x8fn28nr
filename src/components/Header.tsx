import { Bell, Search, UserCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export function Header() {
  const { user } = useAuth()

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
        <Button variant="ghost" size="icon" className="relative text-gray-600">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
        </Button>
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
