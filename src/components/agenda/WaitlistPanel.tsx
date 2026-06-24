import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRealtime } from '@/hooks/use-realtime'
import { Plus } from 'lucide-react'

export function WaitlistPanel() {
  const [items, setItems] = useState<any[]>([])

  const load = async () => {
    try {
      const records = await pb
        .collection('waitlist')
        .getFullList({ expand: 'patient', sort: 'created' })
      setItems(records)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('waitlist', () => load())

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
        <CardTitle className="text-sm font-semibold">Lista de Espera</CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 py-4 flex-1 overflow-auto flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Fila vazia</p>
        ) : (
          items.map((it) => (
            <div
              key={it.id}
              className="text-sm p-3 border rounded-md bg-card shadow-sm flex flex-col gap-1"
            >
              <div className="font-medium text-foreground">
                {it.expand?.patient?.name || 'Paciente'}
              </div>
              <div className="flex justify-between items-center">
                <Badge variant="secondary" className="text-[10px]">
                  {it.type === 'novos_pacientes' ? 'Novo' : 'Reagendamento'}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(it.created).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
