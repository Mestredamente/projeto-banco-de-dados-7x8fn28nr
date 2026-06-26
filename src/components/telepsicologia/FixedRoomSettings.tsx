import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Info } from 'lucide-react'

export function FixedRoomSettings() {
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!pb.authStore.record) return
        const u = await pb.collection('users').getOne(pb.authStore.record.id)
        setLink(u.sala_fixa || '')
      } catch {
        /* intentionally ignored */
      }
    }
    fetchUser()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      await pb.collection('users').update(pb.authStore.record!.id, { sala_fixa: link })
      await pb.collection('users').authRefresh() // update auth store cache
      toast.success('Sala fixa atualizada com sucesso!')
    } catch (e) {
      toast.error('Erro ao salvar sala fixa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 max-w-2xl space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Configuração da Sala Fixa</h3>
        <p className="text-muted-foreground text-sm flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          Ao definir uma sala fixa, o link será pré-preenchido automaticamente em todas as novas
          sessões online agendadas na Agenda.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Link da Sala Fixa (URL)</Label>
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Ex: https://meet.google.com/abc-defg-hij"
        />
      </div>

      <Button onClick={handleSave} disabled={loading}>
        Salvar Sala Fixa
      </Button>
    </Card>
  )
}
