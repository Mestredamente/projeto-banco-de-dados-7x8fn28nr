import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { Button, Card, CardHeader, CardTitle, CardContent, Textarea } from '@/components/system'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useSettingsForm } from './use-settings-form'
import { Database, AlertTriangle } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { toast } from '@/hooks/use-toast'

export function MaintenanceTab() {
  const { initialData, loading, saving, saveSettings } = useSettingsForm()
  const { register, handleSubmit, watch, setValue, reset } = useForm()
  const [requesting, setRequesting] = useState(false)
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    if (initialData) reset(initialData)

    pb.collection('audit_logs')
      .getList(1, 50, { sort: '-created' })
      .then((res) => setLogs(res.items))
      .catch(() => {})
  }, [initialData, reset])

  const onSubmit = (data: any) => saveSettings(data)

  const handleBackup = async () => {
    setRequesting(true)
    try {
      await pb.send('/backend/v1/request-backup', { method: 'POST' })
      toast({
        title: 'Sucesso',
        description: 'Backup solicitado! Você receberá um link por email.',
      })
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao solicitar backup.', variant: 'destructive' })
    } finally {
      setRequesting(false)
    }
  }

  if (loading) return <div className="text-gray-500 p-4">Carregando dados...</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Modo de Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-red-50 rounded-xl border border-red-100">
              <div>
                <Label className="text-red-900 font-semibold text-lg">Ativar Modo Manutenção</Label>
                <p className="text-sm text-red-700 mt-1">
                  Bloqueia o acesso de todos os usuários (exceto gestores) ao sistema.
                </p>
              </div>
              <Switch
                checked={watch('maintenance_mode') || false}
                onCheckedChange={(v) => setValue('maintenance_mode', v)}
              />
            </div>

            {watch('maintenance_mode') && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label>Mensagem Exibida aos Usuários</Label>
                <Textarea
                  {...register('maintenance_message')}
                  rows={3}
                  placeholder="Voltaremos em breve..."
                />
              </div>
            )}

            <Button
              type="submit"
              isLoading={saving}
              variant={watch('maintenance_mode') ? 'destructive' : 'default'}
            >
              Salvar Status
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saúde do Sistema & Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border">
            <div>
              <Label className="font-semibold text-base">Backup do Banco de Dados</Label>
              <p className="text-sm text-gray-500 mt-1">
                Gera um arquivo com todos os dados atuais da plataforma.
              </p>
            </div>
            <Button onClick={handleBackup} disabled={requesting} variant="outline">
              <Database className="w-4 h-4 mr-2" />
              Solicitar Backup
            </Button>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <Label className="font-semibold">Últimos Logs (Ações Recentes)</Label>
            <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-xs overflow-y-auto max-h-[300px] custom-scrollbar shadow-inner">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className="mb-1.5 opacity-90 hover:opacity-100">
                    <span className="text-gray-500">[{log.created.substring(0, 19)}]</span>{' '}
                    <span className="text-blue-300">{log.action}</span> on{' '}
                    <span className="text-yellow-300">{log.table_name}</span>{' '}
                    {log.actor ? `by ${log.actor}` : ''}
                  </div>
                ))
              ) : (
                <div className="text-gray-500">Nenhum log encontrado.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
