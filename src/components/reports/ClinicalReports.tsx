import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { FileText, HeartPulse, Activity } from 'lucide-react'

export function ClinicalReports({ startDate, endDate, patientId }: any) {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    if (!patientId || patientId === 'all') return

    async function load() {
      try {
        const [notes, diaries, responses] = await Promise.all([
          pb.collection('session_notes').getFullList({
            filter: `patient = '${patientId}' && created >= '${startDate}' && created <= '${endDate}'`,
          }),
          pb.collection('diary_entries').getFullList({
            filter: `patient = '${patientId}' && created >= '${startDate}' && created <= '${endDate}'`,
          }),
          pb.collection('questionnaire_responses').getFullList({
            filter: `assignment.patient = '${patientId}' && created >= '${startDate}' && created <= '${endDate}'`,
            expand: 'assignment.questionnaire',
          }),
        ])

        const combined = [
          ...notes.map((n) => ({
            id: n.id,
            date: new Date(n.created),
            type: 'sessao',
            title: 'Sessão Clínica',
            description: n.content || n.main_complaint || 'Sem conteúdo',
            shared: n.shared_with_patient,
            record: n,
          })),
          ...diaries.map((d) => ({
            id: d.id,
            date: new Date(d.entry_date),
            type: 'diario',
            title: 'Diário de Humor',
            description: `${d.mood} - ${d.content}`,
            shared: false,
            record: d,
          })),
          ...responses.map((r) => ({
            id: r.id,
            date: new Date(r.created),
            type: 'questionario',
            title: `Escala: ${r.expand?.assignment?.expand?.questionnaire?.title || 'Avaliação'}`,
            description: 'Respostas submetidas pelo paciente.',
            shared: false,
            record: r,
          })),
        ]

        combined.sort((a, b) => b.date.getTime() - a.date.getTime())
        setItems(combined)
      } catch (err) {
        console.error(err)
        toast.error('Erro ao carregar dados clínicos')
      }
    }
    load()
  }, [patientId, startDate, endDate])

  const toggleShare = async (id: string, val: boolean) => {
    try {
      await pb.collection('session_notes').update(id, { shared_with_patient: val })
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, shared: val } : i)))
      toast.success('Permissão atualizada com sucesso.')
    } catch {
      toast.error('Erro ao atualizar permissão.')
    }
  }

  if (!patientId || patientId === 'all') {
    return (
      <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/20">
        Selecione um paciente específico nos filtros para ver a linha do tempo clínica.
      </div>
    )
  }

  return (
    <div className="pl-6 border-l-2 border-teal-100 dark:border-teal-900 space-y-6 relative mt-4">
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum registro encontrado no período.</p>
      )}
      {items.map((item) => (
        <div key={item.id} className="relative">
          <div className="absolute -left-[35px] bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 p-1.5 rounded-full border border-background">
            {item.type === 'sessao' ? (
              <FileText className="w-4 h-4" />
            ) : item.type === 'diario' ? (
              <HeartPulse className="w-4 h-4" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
          </div>
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {format(item.date, 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
            </CardHeader>
            <CardContent className="py-3 text-sm">
              <p className="text-muted-foreground">{item.description}</p>
              {item.type === 'sessao' && (
                <div className="mt-4 flex items-center space-x-2 pt-2 border-t">
                  <Switch
                    checked={item.shared}
                    onCheckedChange={(val) => toggleShare(item.id, val)}
                  />
                  <Label className="text-xs cursor-pointer">
                    Compartilhar resumo com o paciente no Portal
                  </Label>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
