import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Textarea,
  Input,
} from '@/components/system'
import { Label } from '@/components/ui/label'
import { useSettingsForm } from './use-settings-form'

export function TermsPrivacyTab() {
  const { initialData, loading, saving, saveSettings } = useSettingsForm()
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    if (initialData) reset(initialData)
  }, [initialData, reset])

  const onSubmit = (data: any) => {
    data.document_updated_at = new Date().toISOString()
    saveSettings(data)
  }

  if (loading) return <div className="text-gray-500 p-4">Carregando dados...</div>

  return (
    <Card className="animate-in fade-in duration-300">
      <CardHeader>
        <CardTitle>Termos e Privacidade</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div className="space-y-2">
              <Label>Versão Atual</Label>
              <Input {...register('document_version')} placeholder="Ex: 1.0.0" />
            </div>
            <div className="space-y-2">
              <Label>Última Atualização</Label>
              <Input
                disabled
                value={
                  initialData?.document_updated_at
                    ? new Date(initialData.document_updated_at).toLocaleDateString('pt-BR')
                    : '-'
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Termos de Uso</Label>
            <Textarea
              {...register('terms_of_use')}
              rows={15}
              placeholder="Cole aqui o conteúdo dos termos de uso..."
              className="font-mono text-sm leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <Label>Política de Privacidade</Label>
            <Textarea
              {...register('privacy_policy')}
              rows={15}
              placeholder="Cole aqui o conteúdo da política de privacidade..."
              className="font-mono text-sm leading-relaxed"
            />
          </div>

          <Button type="submit" isLoading={saving}>
            Salvar Documentos
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
