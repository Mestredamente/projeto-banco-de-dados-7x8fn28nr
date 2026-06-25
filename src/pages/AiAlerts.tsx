import { useEffect, useState } from 'react'
import {
  BrainCircuit,
  AlertTriangle,
  FileEdit,
  RefreshCcw,
  ShoppingCart,
  GraduationCap,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function AiAlerts() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const data = await pb.collection('ai_alerts').getFullList({
        sort: 'is_resolved,-date_generated',
        expand: 'patient',
      })
      setAlerts(data)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao carregar alertas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  useRealtime('ai_alerts', () => {
    loadAlerts()
  })

  const triggerAnalysis = async () => {
    try {
      setProcessing(true)
      await pb.send('/backend/v1/ai/trigger-analysis', { method: 'POST' })
      toast({
        title: 'Análise de IA concluída',
        description: 'Novos alertas podem ter sido gerados.',
      })
      loadAlerts()
    } catch (err) {
      toast({
        title: 'Erro na análise',
        description: 'Falha ao rodar o motor de inteligência.',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const markResolved = async (id: string) => {
    try {
      await pb.collection('ai_alerts').update(id, { is_resolved: true })
      toast({ title: 'Alerta resolvido' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar alerta', variant: 'destructive' })
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'reavaliação':
        return <RefreshCcw className="w-5 h-5 text-blue-500" />
      case 'evolução':
        return <FileEdit className="w-5 h-5 text-yellow-500" />
      case 'crise':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'compra':
        return <ShoppingCart className="w-5 h-5 text-orange-500" />
      case 'academy':
        return <GraduationCap className="w-5 h-5 text-purple-500" />
      default:
        return <BrainCircuit className="w-5 h-5 text-gray-500" />
    }
  }

  const getPriorityColor = (prio: string, resolved: boolean) => {
    if (resolved) return 'bg-gray-100 text-gray-500'
    if (prio === 'alta') return 'bg-red-100 text-red-800 border-red-200'
    if (prio === 'média') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary" />
            Motor de Inteligência e Alertas
          </h1>
          <p className="text-muted-foreground mt-1">
            Recomendações proativas geradas automaticamente pela IA.
          </p>
        </div>
        <Button onClick={triggerAnalysis} disabled={processing} className="w-full md:w-auto">
          {processing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <BrainCircuit className="w-4 h-4 mr-2" />
          )}
          {processing ? 'Processando...' : 'Rodar Análise Agora'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BrainCircuit className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">Tudo tranquilo por aqui!</h3>
            <p className="text-muted-foreground">
              O motor de IA não identificou pendências clínicas ou operacionais no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={cn('transition-colors', alert.is_resolved && 'opacity-60 bg-muted/30')}
            >
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="flex gap-3">
                  <div className="mt-1">{getIcon(alert.type)}</div>
                  <div>
                    <CardTitle className="text-base font-semibold capitalize">
                      {alert.type}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {format(new Date(alert.date_generated), 'dd/MM/yyyy HH:mm')}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'uppercase text-xs',
                    getPriorityColor(alert.priority, alert.is_resolved),
                  )}
                >
                  {alert.priority}
                </Badge>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-foreground leading-relaxed">{alert.description}</p>
                {alert.expand?.patient && (
                  <p className="text-sm font-medium mt-3 flex items-center gap-1 text-primary">
                    <span className="text-muted-foreground font-normal">Paciente associado:</span>{' '}
                    {alert.expand.patient.name}
                  </p>
                )}
              </CardContent>
              {!alert.is_resolved && (
                <CardFooter className="pt-0">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => markResolved(alert.id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Marcar como Resolvido
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
