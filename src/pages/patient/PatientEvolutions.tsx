import { useEffect, useState, useCallback } from 'react'
import { usePatient } from '@/hooks/use-patient'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { FileText, HelpCircle } from 'lucide-react'

export default function PatientEvolutions() {
  const { patient, loading } = usePatient()
  const [notes, setNotes] = useState<any[]>([])

  const loadNotes = useCallback(async () => {
    if (!patient) return
    try {
      const records = await pb.collection('session_notes').getFullList({
        filter: `patient="${patient.id}" && shared_with_patient=true`,
        sort: '-session_date',
        expand: 'professional',
      })
      setNotes(records)
    } catch (err) {
      console.error(err)
    }
  }, [patient])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  useRealtime('session_notes', () => {
    loadNotes()
  })

  const requestMoreInfo = async (noteId: string, professionalId: string) => {
    try {
      await pb.collection('notifications').create({
        profile: professionalId,
        patient: patient.id,
        title: 'Solicitação de Informação',
        body: `O paciente gostaria de mais detalhes sobre o resumo da sessão do dia.`,
        type: 'alerta',
        reference_table: 'session_notes',
        reference_id: noteId,
      })
      toast({ title: 'Solicitação enviada ao psicólogo.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-teal-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evoluções Compartilhadas</h1>
          <p className="text-gray-500">
            Resumos e orientações disponibilizados pelo seu psicólogo.
          </p>
        </div>
      </div>

      {notes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-gray-500">
            Nenhuma evolução compartilhada até o momento.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {notes.map((note) => (
            <Card key={note.id} className="border-l-4 border-l-teal-500 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Sessão de {format(parseISO(note.session_date), 'dd/MM/yyyy')}</span>
                  <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Dr(a). {note.expand?.professional?.name}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                  {note.content ||
                    note.soap_plan ||
                    note.interventions ||
                    'Sem conteúdo descritivo compartilhado.'}
                </div>
                {note.homework && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-md border border-yellow-100">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-500 text-sm mb-1">
                      Tarefa / Recomendação:
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">{note.homework}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-900/50 py-3 rounded-b-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 ml-auto"
                  onClick={() => requestMoreInfo(note.id, note.professional)}
                >
                  <HelpCircle className="h-4 w-4 mr-2" /> Solicitar mais informações
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
