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
import { maskCurrency } from '@/lib/masks'

export function FiscalSettingsTab() {
  const { initialData, loading, saving, saveSettings } = useSettingsForm()
  const { register, handleSubmit, setValue, watch, reset } = useForm()
  const [certFile, setCertFile] = useState<File | null>(null)

  useEffect(() => {
    if (initialData) {
      reset(initialData)
      if (initialData.standard_tax_rate) {
        setValue(
          'standard_tax_rate_str',
          maskCurrency((initialData.standard_tax_rate * 100).toString()),
        )
      }
    }
  }, [initialData, reset, setValue])

  const onSubmit = async (data: any) => {
    const rateVal = parseFloat(data.standard_tax_rate_str?.replace(/\D/g, '') || '0') / 10000
    const formData = new FormData()
    formData.append('tax_regime', data.tax_regime || '')
    formData.append('standard_tax_rate', rateVal.toString())
    formData.append('invoice_series', data.invoice_series || '')
    if (certFile) formData.append('digital_certificate', certFile)

    await saveSettings(formData as any)
  }

  if (loading) return <div className="text-gray-500 p-4">Carregando dados...</div>

  return (
    <Card className="animate-in fade-in duration-300">
      <CardHeader>
        <CardTitle>Configurações Fiscais</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Regime Tributário</Label>
              <Select
                value={watch('tax_regime') || ''}
                onChange={(e) => setValue('tax_regime', e.target.value)}
                options={[
                  { label: 'Simples Nacional', value: 'Simples Nacional' },
                  { label: 'Lucro Presumido', value: 'Lucro Presumido' },
                  { label: 'Lucro Real', value: 'Lucro Real' },
                  { label: 'MEI', value: 'MEI' },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>Alíquota Padrão (%)</Label>
              <Input
                {...register('standard_tax_rate_str')}
                onChange={(e) => setValue('standard_tax_rate_str', maskCurrency(e.target.value))}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Série da Nota Fiscal</Label>
              <Input {...register('invoice_series')} />
            </div>
            <div className="space-y-2">
              <Label>Certificado Digital (A1/A3)</Label>
              <Input
                type="file"
                accept=".pfx,.p12,.cer,.crt"
                onChange={(e) => setCertFile(e.target.files?.[0] || null)}
              />
              {initialData?.digital_certificate && (
                <p className="text-sm text-gray-500 mt-1">
                  Certificado atual: {initialData.digital_certificate}
                </p>
              )}
            </div>
          </div>
          <Button type="submit" isLoading={saving}>
            Salvar Configurações Fiscais
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
