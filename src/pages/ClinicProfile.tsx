import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const schema = z.object({
  name: z.string().min(1, 'Nome Fantasia é obrigatório'),
  razao_social: z.string().min(1, 'Razão Social é obrigatória'),
  cnpj: z.string().min(18, 'CNPJ inválido').max(18),
  crp_pj: z.string().min(1, 'CRP é obrigatório'),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').or(z.literal('')),
  address_cep: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida')
    .optional()
    .or(z.literal('')),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida')
    .optional()
    .or(z.literal('')),
})

export default function ClinicProfile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      razao_social: '',
      cnpj: '',
      crp_pj: '',
      phone: '',
      email: '',
      address_cep: '',
      address_street: '',
      address_number: '',
      address_complement: '',
      address_neighborhood: '',
      address_city: '',
      address_state: '',
      primary_color: '#0d9488',
      secondary_color: '#115e59',
    },
  })

  const primaryColor = form.watch('primary_color') || '#0d9488'
  const secondaryColor = form.watch('secondary_color') || '#115e59'
  const nomeFantasia = form.watch('name') || 'Nome da Clínica'

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const rels = await pb.collection('clinic_professionals').getList(1, 1, {
          filter: `professional = "${user?.id}" && is_active = true && deleted_at = ""`,
          expand: 'clinic',
        })
        if (rels.items.length > 0) {
          const clinic = rels.items[0].expand?.clinic
          if (clinic) {
            setClinicId(clinic.id)
            form.reset({
              name: clinic.name || '',
              razao_social: clinic.razao_social || '',
              cnpj: clinic.cnpj || '',
              crp_pj: clinic.crp_pj || '',
              phone: clinic.phone || '',
              email: clinic.email || '',
              address_cep: clinic.address_cep || '',
              address_street: clinic.address_street || '',
              address_number: clinic.address_number || '',
              address_complement: clinic.address_complement || '',
              address_neighborhood: clinic.address_neighborhood || '',
              address_city: clinic.address_city || '',
              address_state: clinic.address_state || '',
              primary_color: clinic.primary_color || '#0d9488',
              secondary_color: clinic.secondary_color || '#115e59',
            })
            if (clinic.logo) {
              setLogoPreview(pb.files.getURL(clinic, clinic.logo))
            }
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    if (user?.id) fetchClinic()
  }, [user, form])

  const onSubmit = async (data: any) => {
    if (!clinicId) return
    setLoading(true)
    try {
      const formData = new FormData()
      Object.keys(data).forEach((key) => formData.append(key, data[key]))
      if (logoFile) {
        formData.append('logo', logoFile)
      }
      await pb.collection('clinics').update(clinicId, formData)
      toast({ title: 'Sucesso', description: 'Dados da clínica atualizados com sucesso.' })
      window.location.reload()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar as alterações.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '')
    if (v.length > 14) v = v.substring(0, 14)
    v = v.replace(/^(\d{2})(\d)/, '$1.$2')
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2')
    v = v.replace(/(\d{4})(\d)/, '$1-$2')
    form.setValue('cnpj', v, { shouldValidate: true })
  }

  const handleCrpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '')
    if (v.length > 6) v = v.substring(0, 6)
    v = v.replace(/^(\d{2})(\d)/, '$1/$2')
    form.setValue('crp_pj', v, { shouldValidate: true })
  }

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          form.setValue('address_street', data.logradouro)
          form.setValue('address_neighborhood', data.bairro)
          form.setValue('address_city', data.localidade)
          form.setValue('address_state', data.uf)
        }
      } catch {
        /* intentionally ignored */
      }
    }
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '')
    if (v.length > 8) v = v.substring(0, 8)
    v = v.replace(/^(\d{5})(\d)/, '$1-$2')
    form.setValue('address_cep', v)
    if (v.replace(/\D/g, '').length === 8) {
      fetchAddressByCep(v)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '')
    if (v.length > 11) v = v.substring(0, 11)
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2')
    form.setValue('phone', v)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Logo deve ter no máximo 2MB.',
        })
        return
      }
      if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Formato inválido. Use PNG, JPG ou SVG.',
        })
        return
      }
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Perfil da Clínica</h1>
        <p className="text-muted-foreground mt-1">
          Configure os dados legais e a identidade visual da clínica.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Legais e Contato</CardTitle>
              <CardDescription>Informações oficiais para faturamento e relatórios.</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="clinic-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Fantasia *</Label>
                    <Input {...form.register('name')} placeholder="Sua Clínica" />
                    {form.formState.errors.name && (
                      <span className="text-xs text-red-500">
                        {form.formState.errors.name.message as string}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Razão Social *</Label>
                    <Input {...form.register('razao_social')} placeholder="Sua Clínica LTDA" />
                    {form.formState.errors.razao_social && (
                      <span className="text-xs text-red-500">
                        {form.formState.errors.razao_social.message as string}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ *</Label>
                    <Input
                      {...form.register('cnpj')}
                      onChange={handleCnpjChange}
                      placeholder="00.000.000/0000-00"
                    />
                    {form.formState.errors.cnpj && (
                      <span className="text-xs text-red-500">
                        {form.formState.errors.cnpj.message as string}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>CRP (Pessoa Jurídica) *</Label>
                    <Input
                      {...form.register('crp_pj')}
                      onChange={handleCrpChange}
                      placeholder="00/0000"
                    />
                    {form.formState.errors.crp_pj && (
                      <span className="text-xs text-red-500">
                        {form.formState.errors.crp_pj.message as string}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail de Contato</Label>
                    <Input
                      {...form.register('email')}
                      type="email"
                      placeholder="contato@clinica.com.br"
                    />
                    {form.formState.errors.email && (
                      <span className="text-xs text-red-500">
                        {form.formState.errors.email.message as string}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      {...form.register('phone')}
                      onChange={handlePhoneChange}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <Label>CEP</Label>
                    <Input
                      {...form.register('address_cep')}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-8 space-y-2">
                    <Label>Logradouro</Label>
                    <Input {...form.register('address_street')} placeholder="Rua, Avenida, etc." />
                  </div>
                  <div className="col-span-12 md:col-span-3 space-y-2">
                    <Label>Número</Label>
                    <Input {...form.register('address_number')} />
                  </div>
                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <Label>Complemento</Label>
                    <Input {...form.register('address_complement')} />
                  </div>
                  <div className="col-span-12 md:col-span-5 space-y-2">
                    <Label>Bairro</Label>
                    <Input {...form.register('address_neighborhood')} />
                  </div>
                  <div className="col-span-12 md:col-span-8 space-y-2">
                    <Label>Cidade</Label>
                    <Input {...form.register('address_city')} />
                  </div>
                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <Label>Estado (UF)</Label>
                    <Input {...form.register('address_state')} maxLength={2} />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identidade Visual</CardTitle>
              <CardDescription>
                Personalize as cores e a logo do sistema para sua clínica.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Logo da Clínica (Máx 2MB, PNG/JPG/SVG)</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-md border flex items-center justify-center bg-muted overflow-hidden shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground text-center">
                        Sem
                        <br />
                        Logo
                      </span>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={handleLogoChange}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor Primária (Hex)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="w-12 p-1 h-10 cursor-pointer"
                      {...form.register('primary_color')}
                    />
                    <Input
                      className="flex-1 font-mono uppercase"
                      {...form.register('primary_color')}
                      placeholder="#0d9488"
                      maxLength={7}
                    />
                  </div>
                  {form.formState.errors.primary_color && (
                    <span className="text-xs text-red-500">
                      {form.formState.errors.primary_color.message as string}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Cor Secundária (Hex)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="w-12 p-1 h-10 cursor-pointer"
                      {...form.register('secondary_color')}
                    />
                    <Input
                      className="flex-1 font-mono uppercase"
                      {...form.register('secondary_color')}
                      placeholder="#115e59"
                      maxLength={7}
                    />
                  </div>
                  {form.formState.errors.secondary_color && (
                    <span className="text-xs text-red-500">
                      {form.formState.errors.secondary_color.message as string}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" form="clinic-form" disabled={loading} size="lg">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <CardTitle>Visualização</CardTitle>
                <CardDescription>
                  Como o sistema aparecerá para os profissionais da clínica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden shadow-sm bg-gray-50 flex flex-col">
                  {/* Header sim */}
                  <div
                    className="h-12 flex items-center px-4 shrink-0 transition-colors"
                    style={{ backgroundColor: primaryColor, color: '#ffffff' }}
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="h-6 max-w-[150px] object-contain"
                      />
                    ) : (
                      <span className="font-bold text-sm truncate">{nomeFantasia}</span>
                    )}
                  </div>
                  <div className="p-4 space-y-4">
                    <div
                      className="bg-white p-4 rounded shadow-sm border-l-4 transition-colors"
                      style={{ borderLeftColor: secondaryColor }}
                    >
                      <h4 className="text-sm font-semibold text-gray-800">Card de Exemplo</h4>
                      <p className="text-xs text-gray-500 mt-1 mb-3">
                        Este é um elemento visual do sistema com sua marca aplicada.
                      </p>
                      <button
                        className="w-full py-2 rounded text-xs font-medium text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Ação Principal
                      </button>
                    </div>
                    <div className="text-center pt-2">
                      <span className="text-xs text-gray-400">
                        Seus pacientes verão esta identidade no portal
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
