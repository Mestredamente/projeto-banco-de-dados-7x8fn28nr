import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/system'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/system/PhoneInput'
import { lookupCEP, lookupCNPJ } from '@/lib/lookups'
import { maskCNPJ, maskCEP } from '@/lib/masks'
import { useSettingsForm } from './use-settings-form'

export function CompanyDataTab() {
  const { initialData, loading, saving, saveSettings } = useSettingsForm()
  const { register, handleSubmit, setValue, watch, reset } = useForm()

  useEffect(() => {
    if (initialData) reset(initialData)
  }, [initialData, reset])

  const onSubmit = (data: any) => saveSettings(data)

  const cnpj = watch('cnpj')
  useEffect(() => {
    if (cnpj && cnpj.replace(/\D/g, '').length === 14) {
      lookupCNPJ(cnpj.replace(/\D/g, '')).then((data: any) => {
        if (data.razao_social) setValue('company_name', data.razao_social)
        if (data.nome_fantasia) setValue('trading_name', data.nome_fantasia)
      })
    }
  }, [cnpj, setValue])

  const cep = watch('address_cep')
  useEffect(() => {
    if (cep && cep.replace(/\D/g, '').length === 8) {
      lookupCEP(cep.replace(/\D/g, '')).then((data: any) => {
        if (data.logradouro) setValue('address_street', data.logradouro)
        if (data.bairro) setValue('address_neighborhood', data.bairro)
        if (data.localidade) setValue('address_city', data.localidade)
        if (data.uf) setValue('address_state', data.uf)
      })
    }
  }, [cep, setValue])

  if (loading) return <div className="text-gray-500 p-4">Carregando dados...</div>

  return (
    <Card className="animate-in fade-in duration-300">
      <CardHeader>
        <CardTitle>Dados da Empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                {...register('cnpj')}
                onChange={(e) => setValue('cnpj', maskCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Razão Social <span className="text-red-500">*</span>
              </Label>
              <Input {...register('company_name')} required />
            </div>
            <div className="space-y-2">
              <Label>Nome Fantasia</Label>
              <Input {...register('trading_name')} defaultValue="Syntrapsi" />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Estadual</Label>
              <Input {...register('state_registration')} />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Municipal</Label>
              <Input {...register('municipal_registration')} />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                {...register('address_cep')}
                onChange={(e) => setValue('address_cep', maskCEP(e.target.value))}
                placeholder="00000-000"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Endereço</Label>
              <Input {...register('address_street')} />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input {...register('address_number')} />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input {...register('address_complement')} />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input {...register('address_neighborhood')} />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input {...register('address_city')} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input {...register('address_state')} />
            </div>
            <div className="space-y-2">
              <Label>Email de Contato</Label>
              <Input type="email" {...register('contact_email')} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <PhoneInput
                value={watch('contact_phone') || ''}
                onChange={(val) => setValue('contact_phone', val)}
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input type="url" {...register('website')} placeholder="https://" />
            </div>
          </div>
          <Button type="submit" isLoading={saving}>
            Salvar Dados
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
