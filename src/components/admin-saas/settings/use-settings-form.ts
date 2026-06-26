import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { toast } from '@/hooks/use-toast'

export function useSettingsForm() {
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [initialData, setInitialData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    pb.collection('system_settings')
      .getList(1, 1)
      .then((res) => {
        if (res.items.length > 0) {
          setSettingsId(res.items[0].id)
          setInitialData(res.items[0])
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const saveSettings = async (data: any) => {
    setSaving(true)
    try {
      if (settingsId) {
        await pb.collection('system_settings').update(settingsId, data)
      } else {
        const created = await pb.collection('system_settings').create(data)
        setSettingsId(created.id)
      }
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso!' })
      return true
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar as configurações.',
        variant: 'destructive',
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  return { settingsId, initialData, loading, saving, saveSettings }
}
