import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import {
  billingPreferencesSchema,
  getPatientBillingPreferences,
  updatePatientBillingPreferences,
  PAYMENT_METHODS,
  NOTIFICATION_CHANNELS,
  type BillingPreferences,
} from '@/services/patient-billing'

const numOrUndef = (v: string) => (v === '' ? undefined : Number(v))

export function PatientBillingPreferencesTab({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BillingPreferences>({
    resolver: zodResolver(billingPreferencesSchema) as any,
    defaultValues: {
      auto_billing_enabled: false,
      absence_policy: 'nao_cobra_falta',
      billing_notifications: ['Email'],
      accepted_payment_methods: [],
    } as any,
  })

  const autoBilling = watch('auto_billing_enabled')
  const paymentMethods = watch('accepted_payment_methods') || []
  const notifications = watch('billing_notifications') || []

  const load = useCallback(async () => {
    try {
      const prefs = await getPatientBillingPreferences(patientId)
      reset({
        session_value: prefs.session_value,
        accepted_payment_methods: prefs.accepted_payment_methods || [],
        pix_key: prefs.pix_key || '',
        absence_policy: prefs.absence_policy || 'nao_cobra_falta',
        billing_notifications: prefs.billing_notifications || ['Email'],
        auto_billing_enabled: prefs.auto_billing_enabled || false,
        billing_frequency: prefs.billing_frequency,
        billing_day: prefs.billing_day,
        sessions_per_period: prefs.sessions_per_period,
        billing_start_date: prefs.billing_start_date || '',
        cancellation_policy: prefs.cancellation_policy || '',
      } as any)
    } catch {
      toast.error('Erro ao carregar preferências de cobrança')
    } finally {
      setLoading(false)
    }
  }, [patientId, reset])

  useEffect(() => {
    load()
  }, [load])

  useRealtime(
    'patients',
    () => {
      load()
    },
    !!patientId,
  )

  const toggleArr = (field: keyof BillingPreferences, value: string, current: string[]) => {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    setValue(field, next as any)
  }

  const onSubmit = async (data: BillingPreferences) => {
    setSaving(true)
    try {
      await updatePatientBillingPreferences(patientId, data)
      toast.success('Preferências de cobrança salvas com sucesso')
    } catch {
      toast.error('Erro ao salvar preferências')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Valor e Formas de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session_value">Valor da Sessão (R$)</Label>
              <Input
                id="session_value"
                type="number"
                step="0.01"
                min="0"
                {...register('session_value', { setValueAs: numOrUndef })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pix_key">Chave PIX</Label>
              <Input id="pix_key" {...register('pix_key')} placeholder="PIX para este paciente" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Formas de Pagamento Aceitas</Label>
            <div className="flex flex-wrap gap-4">
              {PAYMENT_METHODS.map((method) => (
                <div key={method} className="flex items-center space-x-2">
                  <Checkbox
                    id={`pm-${method}`}
                    checked={paymentMethods.includes(method)}
                    onCheckedChange={() =>
                      toggleArr('accepted_payment_methods', method, paymentMethods)
                    }
                  />
                  <Label htmlFor={`pm-${method}`}>{method}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Política de Faltas</Label>
            <Select
              value={watch('absence_policy') || 'nao_cobra_falta'}
              onValueChange={(v) => setValue('absence_policy', v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cobra_falta">Cobra falta</SelectItem>
                <SelectItem value="nao_cobra_falta">Não cobra falta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações de Cobrança</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Canais de Notificação</Label>
            <div className="flex flex-wrap gap-4">
              {NOTIFICATION_CHANNELS.map((ch) => (
                <div key={ch} className="flex items-center space-x-2">
                  <Checkbox
                    id={`bn-${ch}`}
                    checked={notifications.includes(ch)}
                    onCheckedChange={() => toggleArr('billing_notifications', ch, notifications)}
                  />
                  <Label htmlFor={`bn-${ch}`}>{ch}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faturamento Automático</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto_billing_enabled">Ativar faturamento automático</Label>
            <Switch
              id="auto_billing_enabled"
              checked={!!autoBilling}
              onCheckedChange={(v) => setValue('auto_billing_enabled', v)}
            />
          </div>
          {autoBilling && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-fade-in">
              <div className="space-y-2">
                <Label>Frequência de Cobrança</Label>
                <Select
                  value={watch('billing_frequency') || ''}
                  onValueChange={(v) => setValue('billing_frequency', v as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avulsa">Avulsa</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
                {errors.billing_frequency && (
                  <p className="text-sm text-red-500">{errors.billing_frequency.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_day">Dia de Cobrança (1-31)</Label>
                <Input
                  id="billing_day"
                  type="number"
                  min="1"
                  max="31"
                  {...register('billing_day', { setValueAs: numOrUndef })}
                />
                {errors.billing_day && (
                  <p className="text-sm text-red-500">{errors.billing_day.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessions_per_period">Sessões por Período (1-5)</Label>
                <Input
                  id="sessions_per_period"
                  type="number"
                  min="1"
                  max="5"
                  {...register('sessions_per_period', { setValueAs: numOrUndef })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_start_date">Data de Início</Label>
                <Input id="billing_start_date" type="date" {...register('billing_start_date')} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Política de Cancelamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('cancellation_policy')}
            placeholder="Descreva as regras de cancelamento para este paciente..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Preferências
        </Button>
      </div>
    </form>
  )
}
