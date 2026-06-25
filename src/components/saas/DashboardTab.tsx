import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, Activity, UserPlus } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/system/Skeleton'
import { ErrorState } from '@/components/system/ErrorState'

export function DashboardTab() {
  const [data, setData] = useState({
    activeSubscribers: 0,
    mrr: 0,
    churnRate: 0,
    newSignups: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const [activeUsersRes, activeSubsRes, canceledSubsThisMonthRes, newUsersThisMonthRes] =
          await Promise.all([
            pb
              .collection('users')
              .getList(1, 1, {
                filter:
                  "(role = 'psicologo_autonomo' || role = 'psicologo_vinculado' || role = 'admin_clinica') && is_active = true",
              })
              .catch((e) => {
                console.warn("Coleção 'users' indisponível", e)
                return null
              }),
            pb
              .collection('subscriptions')
              .getFullList({
                filter: "status = 'active' || status = 'trial'",
                expand: 'plan',
              })
              .catch((e) => {
                console.warn("Coleção 'subscriptions' indisponível", e)
                return null
              }),
            pb
              .collection('subscriptions')
              .getList(1, 1, {
                filter: `status = 'canceled' && canceled_at >= '${startOfMonth}'`,
              })
              .catch(() => null),
            pb
              .collection('users')
              .getList(1, 1, {
                filter: `created >= '${startOfMonth}'`,
              })
              .catch(() => null),
          ])

        if (!isMounted) return

        if (activeUsersRes === null || activeSubsRes === null) {
          throw new Error('Indisponível')
        }

        const activeUsers = activeUsersRes.totalItems || 0
        const activeSubs = activeSubsRes || []
        const canceledSubsThisMonth = canceledSubsThisMonthRes?.totalItems || 0
        const newSignups = newUsersThisMonthRes?.totalItems || 0

        const mrr = activeSubs.reduce((acc, sub) => acc + (sub.expand?.plan?.price || 0), 0)

        const totalActiveStartOfMonth = activeSubs.length + canceledSubsThisMonth
        const churnRate =
          totalActiveStartOfMonth > 0 ? (canceledSubsThisMonth / totalActiveStartOfMonth) * 100 : 0

        setData({
          activeSubscribers: activeUsers,
          mrr: mrr || 0,
          churnRate: churnRate || 0,
          newSignups: newSignups,
        })
      } catch (err: any) {
        if (isMounted) setError(err.message === 'Indisponível' ? 'Indisponível' : 'Erro interno')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  if (error) {
    return (
      <ErrorState
        title={error === 'Indisponível' ? 'Indisponível' : 'Erro de Carregamento'}
        message={
          error === 'Indisponível'
            ? 'Algumas coleções necessárias não estão disponíveis no momento.'
            : 'Não foi possível carregar os dados do painel.'
        }
      />
    )
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeSubscribers}</div>
            <p className="text-xs text-muted-foreground">Usuários com acesso ativo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.mrr)}</div>
            <p className="text-xs text-muted-foreground">
              ARR estimado: {formatCurrency(data.mrr * 12)}
            </p>
          </CardContent>
        </Card>
        <Card className={data.churnRate > 5 ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
            <Activity
              className={
                data.churnRate > 5 ? 'h-4 w-4 text-red-600' : 'h-4 w-4 text-muted-foreground'
              }
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.churnRate > 5 ? 'text-red-600' : ''}`}>
              {data.churnRate.toFixed(2).replace('.', ',')}%
            </div>
            <p className="text-xs text-muted-foreground">Cancelamentos neste mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Assinantes</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.newSignups}</div>
            <p className="text-xs text-muted-foreground">Cadastros neste mês</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
