import { useEffect, useState } from 'react'
import { AlertTriangle, Brain, Lightbulb, History, Info, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import pb from '@/lib/pocketbase/client'

export function PatientInsights({ patient }: { patient: any }) {
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!patient?.ai_consent) {
      setLoading(false)
      return
    }

    // Log access
    pb.send('/backend/v1/audit/view', {
      method: 'POST',
      body: JSON.stringify({ record_id: patient.id, table_name: 'clinical_insights' }),
    }).catch(() => {})

    // Fetch insights
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
  }, [patient])

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

  if (insights.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed mt-4">
        <Brain className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p>Nenhum insight gerado ainda.</p>
        <p className="text-sm mt-1">
          Finalize uma evolução clínica para que a IA gere uma análise.
        </p>
      </div>
    )
  }

  const latest = insights[0]

  return (
    <div className="space-y-6 animate-fade-in mt-4">
      <Card className="border-t-4 border-t-amber-500">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Resumo Clínico da IA
            </CardTitle>
            <span className="text-xs text-gray-500">
              Gerado em {new Date(latest.created).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{latest.summary}</p>
        </CardContent>
      </Card>

      {latest.risk_alerts && latest.risk_alerts.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {latest.risk_alerts.map((alert: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-red-800">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span>{alert}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-500" />
              Padrões Detectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latest.detected_patterns?.length > 0 ? (
              <ul className="space-y-2">
                {latest.detected_patterns.map((pattern: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-sm">{pattern}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhum padrão detectado nesta análise.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-orange-500" />
              Tópicos Abandonados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latest.abandoned_topics?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {latest.abandoned_topics.map((topic: string, i: number) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum tópico abandonado identificado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {latest.intervention_suggestion && (
        <Card className="bg-teal-50 border-teal-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-teal-800 text-base flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-teal-600" />
              Sugestão de Intervenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-teal-900 text-sm leading-relaxed">
              {latest.intervention_suggestion}
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
