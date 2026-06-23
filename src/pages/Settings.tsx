import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

export default function Settings() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-500 mt-1">Gerencie suas preferências de conta.</p>
      </div>

      <Card className="max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Perfil do Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Nome</label>
            <p className="text-lg">{user?.name || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-lg">{user?.email || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Função</label>
            <p className="text-lg capitalize">{user?.role?.replace('_', ' ') || '-'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
