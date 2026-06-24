import { useEffect, useState } from 'react'
import { usePatient } from '@/hooks/use-patient'
import pb from '@/lib/pocketbase/client'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { HeartPulse, Calendar as CalendarIcon } from 'lucide-react'

const WORDS = ['Feliz', 'Ansioso', 'Triste', 'Irritado', 'Calmo', 'Cansado', 'Motivado']
const CRISIS_WORDS = ['Ansioso', 'Irritado', 'Triste']

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
  const [entries, setEntries] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  const loadEntries = async () => {
    if (!patient) return
    const records = await pb.collection('diary_entries').getFullList({
      filter: `patient="${patient.id}"`,
      sort: '-entry_date',
    })
    setEntries(records)
  }

  useEffect(() => {
    loadEntries()
  }, [patient])

  const toggleWord = (w: string) => {
    setSelectedWords((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]))
  }

  const handleSubmit = async () => {
    if (selectedWords.length === 0) {
      toast({ title: 'Selecione pelo menos uma palavra', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const isCrisis = selectedWords.some((w) => CRISIS_WORDS.includes(w))
      const record = await pb.collection('diary_entries').create({
        patient: patient.id,
        type: 'sentimentos',
        content: selectedWords.join(', '),
        mood: getEmoji(score),
        mood_score: score,
        is_visible_to_professional: isCrisis,
        entry_date: new Date().toISOString(),
      })

      if (isCrisis) {
        const linked = await pb
          .collection('patient_professionals')
          .getFullList({ filter: `patient="${patient.id}"` })
        for (const rel of linked) {
          await pb.collection('notifications').create({
            profile: rel.professional,
            patient: patient.id,
            title: 'Alerta de Sentimentos',
            body: `O paciente registrou palavras de alerta no diário (${selectedWords.join(', ')}).`,
            type: 'alerta_risco',
            reference_table: 'diary_entries',
            reference_id: record.id,
          })
        }
      }
      toast({ title: 'Registro salvo', description: 'Seu diário foi atualizado com sucesso.' })
      setScore(5)
      setSelectedWords([])
      loadEntries()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div>Carregando...</div>

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
                    className={`cursor-pointer px-3 py-1 text-sm ${selectedWords.includes(w) ? 'bg-teal-600 hover:bg-teal-700' : 'hover:bg-gray-100'}`}
                    onClick={() => toggleWord(w)}
                  >
                    {w}
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-teal-600 text-white"
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
                  <div
                    key={e.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {format(parseISO(e.entry_date), 'dd/MM/yyyy')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{e.content}</p>
                    </div>
                    <div className="text-2xl">{e.mood}</div>
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
