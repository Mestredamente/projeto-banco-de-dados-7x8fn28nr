import { useEffect, useState, useCallback } from 'react'
import { usePatient } from '@/hooks/use-patient'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { HeartPulse, Calendar as CalendarIcon, AlertCircle } from 'lucide-react'

const WORDS = ['Feliz', 'Ansioso', 'Triste', 'Irritado', 'Calmo', 'Cansado', 'Motivado']
const CRISIS_WORDS = ['Ansioso', 'Irritado', 'Triste']

const MIN_CHARS = 10
const MAX_CHARS = 5000

const getEmoji = (val: number) => {
  if (val <= 2) return '😢'
  if (val <= 4) return '🙁'
  if (val <= 6) return '😐'
  if (val <= 8) return '🙂'
  return '😁'
}

export default function PatientDiary() {
  const { patient, loading } = usePatient()
  const [score, setScore] = useState(5)
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [textContent, setTextContent] = useState('')
  const [entries, setEntries] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  const loadEntries = useCallback(async () => {
    if (!patient) return
    try {
      const records = await pb.collection('diary_entries').getFullList({
        filter: `patient="${patient.id}"`,
        sort: '-entry_date',
      })
      setEntries(records)
    } catch (err) {
      console.error(err)
    }
  }, [patient])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  useRealtime('diary_entries', () => {
    loadEntries()
  })

  const toggleWord = (w: string) => {
    setSelectedWords((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]))
  }

  const charCount = textContent.length
  const isTextValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS
  const showTextError = charCount > 0 && charCount < MIN_CHARS

  const handleSubmit = async () => {
    if (textContent.trim().length < MIN_CHARS) {
      toast({
        title: 'Texto muito curto',
        description: `Escreva pelo menos ${MIN_CHARS} caracteres no seu diário.`,
        variant: 'destructive',
      })
      return
    }
    if (charCount > MAX_CHARS) {
      toast({
        title: 'Texto muito longo',
        description: `O limite é de ${MAX_CHARS} caracteres.`,
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const isCrisis = selectedWords.some((w) => CRISIS_WORDS.includes(w))
      const finalContent = textContent.trim()

      await pb.collection('diary_entries').create({
        patient: patient.id,
        type: 'sentimentos',
        content: finalContent,
        mood: getEmoji(score),
        mood_score: score,
        is_visible_to_professional: isCrisis,
        entry_date: new Date().toISOString(),
      })

      toast({ title: 'Registro salvo', description: 'Seu diário foi atualizado com sucesso.' })
      setScore(5)
      setSelectedWords([])
      setTextContent('')
      loadEntries()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div>Carregando...</div>

  const hasConsent = !!(patient as any)?.consent_risk_at

  if (!hasConsent) {
    return (
      <div className="space-y-6 animate-fade-in text-center p-12 bg-white rounded-xl shadow-sm border border-slate-100">
        <HeartPulse className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Recurso Desativado</h2>
        <p className="text-slate-500 max-w-md mx-auto mt-3 leading-relaxed">
          O Diário de Sentimentos está desativado. Para utilizar esta ferramenta, é necessário
          fornecer o consentimento de <strong>Quebra de Sigilo em caso de risco iminente</strong>{' '}
          (Termo de Proteção à Vida).
        </p>
        <p className="text-sm text-slate-400 mt-4">
          Acesse seu perfil ou converse com seu profissional para gerenciar seus consentimentos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <HeartPulse className="h-8 w-8 text-teal-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diário de Sentimentos</h1>
          <p className="text-gray-500">Acompanhe seu estado emocional diariamente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-t-4 border-t-teal-500">
          <CardHeader>
            <CardTitle>Novo Registro</CardTitle>
            <CardDescription>Como você está se sentindo hoje?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center space-y-4">
              <div className="text-6xl animate-float">{getEmoji(score)}</div>
              <Slider
                value={[score]}
                onValueChange={(v) => setScore(v[0])}
                max={10}
                min={1}
                step={1}
                className="w-full max-w-sm mx-auto"
              />
              <p className="text-sm text-gray-500 font-medium text-center">
                Intensidade: {score}/10
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Selecione o que mais define seu dia:
              </label>
              <div className="flex flex-wrap gap-2">
                {WORDS.map((w) => (
                  <Badge
                    key={w}
                    variant={selectedWords.includes(w) ? 'default' : 'outline'}
                    className={`cursor-pointer px-3 py-1 text-sm transition-colors ${selectedWords.includes(w) ? 'bg-teal-600 hover:bg-teal-700' : 'hover:bg-gray-100'}`}
                    onClick={() => toggleWord(w)}
                  >
                    {w}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Descreva seus sentimentos <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value.slice(0, MAX_CHARS))}
                placeholder="O que você está sentindo hoje?"
                minLength={MIN_CHARS}
                maxLength={MAX_CHARS}
                rows={6}
                className={`resize-none ${showTextError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
              />
              <div className="flex items-center justify-between">
                {showTextError ? (
                  <span className="flex items-center gap-1 text-xs text-red-500 animate-fade-in">
                    <AlertCircle className="h-3 w-3" />
                    Mínimo de {MIN_CHARS} caracteres
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Campo obrigatório</span>
                )}
                <span
                  className={`text-xs font-medium ${charCount > MAX_CHARS * 0.9 ? 'text-amber-600' : 'text-gray-400'}`}
                >
                  {charCount}/{MAX_CHARS}
                </span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !isTextValid}
              className="w-full bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Salvando...' : 'Salvar Registro'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              Últimos Registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum registro encontrado.</p>
            ) : (
              <div className="space-y-4">
                {entries.slice(0, 5).map((e) => (
                  <div key={e.id} className="p-3 bg-gray-50 rounded-lg space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {format(parseISO(e.entry_date), 'dd/MM/yyyy')}
                      </p>
                      <div className="text-2xl">{e.mood}</div>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-3">{e.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
