import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Select,
} from '@/components/system'
import { Label } from '@/components/ui/label'
import { useSettingsForm } from './use-settings-form'
import { Eye, EyeOff, Send } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { toast } from '@/hooks/use-toast'

export function TransactionalEmailTab() {
  const { initialData, loading, saving, saveSettings } = useSettingsForm()
  const { register, handleSubmit, setValue, watch, reset } = useForm()
  const [showPassword, setShowPassword] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (initialData) reset(initialData)
  }, [initialData, reset])

  const onSubmit = (data: any) => saveSettings(data)

  const provider = watch('email_provider')

  const handleTestEmail = async () => {
    setTesting(true)
    try {
      await pb.send('/backend/v1/test-email', { method: 'POST' })
      toast({ title: 'Sucesso', description: 'Email de teste enviado com sucesso!' })
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar email de teste.',
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <div className="text-gray-500 p-4">Carregando dados...</div>

  return (
    <Card className="animate-in fade-in duration-300">
      <CardHeader>
        <CardTitle>Email Transacional</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2 max-w-sm">
            <Label>Provedor de Email</Label>
            <Select
              value={provider || ''}
              onChange={(e) => setValue('email_provider', e.target.value)}
              options={[
                { label: 'Selecione', value: '' },
                { label: 'SMTP Próprio', value: 'SMTP Próprio' },
                { label: 'SendGrid', value: 'SendGrid' },
                { label: 'Amazon SES', value: 'Amazon SES' },
                { label: 'Mailgun', value: 'Mailgun' },
                { label: 'Outro', value: 'Outro' },
              ]}
            />
          </div>

          {provider === 'SMTP Próprio' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-xl border animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <Label>Servidor SMTP</Label>
                <Input {...register('smtp_server')} placeholder="smtp.exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>Porta</Label>
                <Input type="number" {...register('smtp_port')} placeholder="587" />
              </div>
              <div className="space-y-2">
                <Label>Usuário</Label>
                <Input {...register('smtp_username')} />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} {...register('smtp_password')} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Criptografia</Label>
                <Select
                  value={watch('smtp_encryption') || ''}
                  onChange={(e) => setValue('smtp_encryption', e.target.value)}
                  options={[
                    { label: 'TLS', value: 'TLS' },
                    { label: 'SSL', value: 'SSL' },
                    { label: 'Nenhuma', value: 'None' },
                  ]}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <Button type="submit" isLoading={saving}>
              Salvar Configurações
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestEmail}
              disabled={testing || !provider}
            >
              <Send className="w-4 h-4 mr-2" /> {testing ? 'Enviando...' : 'Enviar Email de Teste'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
