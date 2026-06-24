import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Brain,
  Lightbulb,
  History,
  Info,
  Sparkles,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import pb from '@/lib/pocketbase/client'

export function PatientInsights({ patient }: { patient: any }) {
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reanalyzing, setReanalyzing] = useState(false)

  const fetchInsights = () => {
    pb.collection('clinical_insights')
      .getList(1, 10, {
        filter: `patient = '${patient.id}'`,
        sort: '-created',
        expand: 'session_note',
      })
      .then((res) => {
        setInsights(res.items)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!patient?.ai_consent) {
      setLoading(false)
      return
    }

    pb.send('/backend/v1/audit/view', {
      method: 'POST',
      body: JSON.stringify({ record_id: patient.id, table_name: 'clinical_insights' }),
    }).catch(() => {})

    fetchInsights()
  }, [patient])

  const handleReanalyze = async () => {
    setReanalyzing(true)
    try {
      await pb.send(`/backend/v1/patients/${patient.id}/analyze`, { method: 'POST' })
      toast({ title: 'Análise atualizada com sucesso!' })
      fetchInsights()
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar análise', description: e.message, variant: 'destructive' })
    } finally {
      setReanalyzing(false)
    }
  }

  const handleFeedback = async (insightId: string, value: 'util' | 'nao_util') => {
    try {
      await pb.send(`/backend/v1/clinical-insights/${insightId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback: value }),
      })
      setInsights((prev) => prev.map((i) => (i.id === insightId ? { ...i, feedback: value } : i)))
      toast({ title: 'Feedback registrado. Obrigado!' })
    } catch (e: any) {
      toast({ title: 'Erro ao registrar feedback', variant: 'destructive' })
    }
  }

  if (!patient?.ai_consent) {
    return (
      <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800 mt-4">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle>Consentimento Necessário</AlertTitle>
        <AlertDescription>
          Análise por IA não disponível para este paciente. Para ativar, solicite o consentimento no
          cadastro.
        </AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        <Skeleton className="h-[150px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    )
  }

  const renderRiskAlerts = (alerts: any[]) => {
    return alerts.map((alertItem, i) => {
      const isObj = typeof alertItem === 'object' && alertItem !== null
      const text = isObj ? alertItem.alert : alertItem
      const level = isObj ? alertItem.level : 'critical'
      const isCritical = level === 'critical'

      return (
        <li
          key={i}
          className={`flex items-start gap-2 ${isCritical ? 'text-red-800' : 'text-green-800'}`}
        >
          {isCritical ? (
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          )}
          <span>{text}</span>
        </li>
      )
    })
  }

  const renderPatterns = (patterns: any[]) => {
    return patterns.map((patternItem, i) => {
      const isObj = typeof patternItem === 'object' && patternItem !== null
      const text = isObj ? patternItem.pattern : patternItem
      const freq = isObj ? patternItem.frequency : null

      return (
        <li key={i} className="flex items-start gap-2 text-gray-700">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{text}</span>
            {freq && <span className="text-xs text-gray-500">{freq}</span>}
          </div>
        </li>
      )
    })
  }

  const renderAbandoned = (topics: any[]) => {
    return topics.map((topicItem, i) => {
      const isObj = typeof topicItem === 'object' && topicItem !== null
      const text = isObj ? topicItem.topic : topicItem
      const time = isObj ? topicItem.time_since_last_mention : null

      return (
        <Badge
          key={i}
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200 flex flex-col items-start gap-1 py-1.5 px-3"
        >
          <span className="font-medium">{text}</span>
          {time && <span className="text-xs text-orange-500 font-normal">Há {time}</span>}
        </Badge>
      )
    })
  }

  if (insights.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed mt-4 space-y-4">
        <Brain className="w-12 h-12 mx-auto text-gray-300" />
        <div>
          <p>Nenhum insight gerado ainda.</p>
          <p className="text-sm mt-1">
            Finalize uma evolução clínica para que a IA gere uma análise.
          </p>
        </div>
        <Button variant="outline" onClick={handleReanalyze} disabled={reanalyzing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${reanalyzing ? 'animate-spin' : ''}`} />
          Tentar Forçar Análise
        </Button>
      </div>
    )
  }

  const latest = insights[0]
  const hasRiskAlerts = latest.risk_alerts && latest.risk_alerts.length > 0
  const hasPatterns = latest.detected_patterns && latest.detected_patterns.length > 0
  const hasAbandoned = latest.abandoned_topics && latest.abandoned_topics.length > 0

  return (
    <div className="space-y-6 animate-fade-in mt-4">
      <div className="flex justify-between items-center pb-2 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Análise de Inteligência Artificial
        </h2>
        <Button variant="outline" size="sm" onClick={handleReanalyze} disabled={reanalyzing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${reanalyzing ? 'animate-spin' : ''}`} />
          {reanalyzing ? 'Analisando...' : 'Atualizar Análise'}
        </Button>
      </div>

      <Card className="border-t-4 border-t-amber-500 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold">Resumo Clínico</CardTitle>
            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
              Gerado em {new Date(latest.created).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed text-sm md:text-base">{latest.summary}</p>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 gap-3">
          <span className="text-xs text-gray-500 font-medium">
            Esta análise foi útil para você?
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant={latest.feedback === 'util' ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs flex-1 sm:flex-none"
              onClick={() => handleFeedback(latest.id, 'util')}
            >
              <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
              Útil
            </Button>
            <Button
              variant={latest.feedback === 'nao_util' ? 'destructive' : 'outline'}
              size="sm"
              className="h-8 text-xs flex-1 sm:flex-none"
              onClick={() => handleFeedback(latest.id, 'nao_util')}
            >
              <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />
              Não útil
            </Button>
          </div>
        </CardFooter>
      </Card>

      {hasRiskAlerts && (
        <Card className="bg-red-50 border-red-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Monitoramento de Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">{renderRiskAlerts(latest.risk_alerts)}</ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-500" />
              Padrões Detectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasPatterns ? (
              <ul className="space-y-3">{renderPatterns(latest.detected_patterns)}</ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhum padrão detectado nesta análise.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-orange-500" />
              Tópicos Abandonados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasAbandoned ? (
              <div className="flex flex-wrap gap-2">{renderAbandoned(latest.abandoned_topics)}</div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum tópico abandonado identificado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {latest.intervention_suggestion && (
        <Card className="bg-teal-50 border-teal-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-teal-800 text-base flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-teal-600" />
              Sugestão de Intervenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-teal-900 text-sm leading-relaxed">
              {latest.intervention_suggestion}
            </p>
            <p className="text-xs text-teal-700/70 border-t border-teal-200/50 pt-3 flex items-center gap-1.5">
              <Info className="w-4 h-4 shrink-0" />
              Sugestão gerada por IA. A decisão clínica é sempre do psicólogo.
            </p>
          </CardContent>
        </Card>
      )}

      {insights.length > 1 && (
        <div className="pt-4 border-t mt-8">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Histórico de Análises</h3>
          <div className="space-y-2">
            {insights.slice(1).map((insight) => (
              <div
                key={insight.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-md border text-sm"
              >
                <span className="text-gray-600">
                  Análise de {new Date(insight.created).toLocaleDateString('pt-BR')}
                </span>
                <Badge variant="secondary">
                  Sessão {insight.expand?.session_note?.session_number || '-'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
