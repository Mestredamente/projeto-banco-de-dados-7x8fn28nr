import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { toast } from '@/components/ui/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

function isValidCPF(cpf: string) {
  cpf = cpf.replace(/[^\d]+/g, '')
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i)
  let resto = 11 - (soma % 11)
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf.charAt(9))) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i)
  resto = 11 - (soma % 11)
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf.charAt(10))) return false
  return true
}

function maskCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

function maskPhone(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4,5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1')
}

function maskCEP(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1')
}

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').or(z.literal('').optional()),
  phone: z.string().optional(),
  cpf: z
    .string()
    .refine((v) => !v || isValidCPF(v), 'CPF inválido')
    .optional()
    .or(z.literal('')),
  rg: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  marital_status: z.string().optional(),
  profession: z.string().optional(),
  address_cep: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  emergency_contact_name: z.string().min(1, 'Nome do contato é obrigatório'),
  emergency_contact_phone: z.string().min(14, 'Telefone inválido'),
  emergency_contact_relation: z.string().min(1, 'Parentesco é obrigatório'),
  health_insurance: z.string().optional(),
  referred_by: z.string().optional(),
  clinical_history: z.string().optional(),
  notes: z.string().optional(),
  consent_form_signed: z.boolean().refine((v) => v === true, 'O consentimento é obrigatório'),
  ai_consent: z.boolean().optional().default(false),
})

export default function PatientForm() {
  const { id } = useParams()
  const isEditing = !!id
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(isEditing)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      rg: '',
      date_of_birth: '',
      gender: '',
      marital_status: '',
      profession: '',
      address_cep: '',
      address_street: '',
      address_number: '',
      address_neighborhood: '',
      address_city: '',
      address_state: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: '',
      health_insurance: '',
      referred_by: '',
      clinical_history: '',
      notes: '',
      consent_form_signed: false,
      ai_consent: false,
    },
  })

  useEffect(() => {
    if (isEditing) {
      pb.collection('patients')
        .getOne(id)
        .then((data) => {
          form.reset({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            cpf: data.cpf || '',
            rg: data.rg || '',
            date_of_birth: data.date_of_birth ? data.date_of_birth.substring(0, 10) : '',
            gender: data.gender || '',
            marital_status: data.marital_status || '',
            profession: data.profession || '',
            address_cep: data.address_cep || '',
            address_street: data.address_street || '',
            address_number: data.address_number || '',
            address_neighborhood: data.address_neighborhood || '',
            address_city: data.address_city || '',
            address_state: data.address_state || '',
            emergency_contact_name: data.emergency_contact_name || '',
            emergency_contact_phone: data.emergency_contact_phone || '',
            emergency_contact_relation: data.emergency_contact_relation || '',
            health_insurance: data.health_insurance || '',
            referred_by: data.referred_by || '',
            clinical_history: data.clinical_history || '',
            notes: data.notes || '',
            consent_form_signed: data.consent_form_signed || false,
            ai_consent: data.ai_consent || false,
          })
        })
        .catch(() => toast({ title: 'Erro ao carregar paciente', variant: 'destructive' }))
        .finally(() => setLoading(false))
    }
  }, [id, form, isEditing])

  const handleCepBlur = async (cep: string) => {
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
        } else {
          toast({ title: 'CEP não encontrado', variant: 'destructive' })
        }
      } catch {
        toast({ title: 'Falha ao buscar CEP. Verifique a conexão.', variant: 'destructive' })
      }
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth ? new Date(values.date_of_birth).toISOString() : null,
        created_by: isEditing ? undefined : user?.id,
        consent_given_at: new Date().toISOString(),
        is_active: true,
      }
      if (isEditing) {
        await pb.collection('patients').update(id, payload)
        toast({ title: 'Paciente atualizado com sucesso' })
      } else {
        await pb.collection('patients').create(payload)
        toast({ title: 'Paciente cadastrado com sucesso' })
      }
      navigate('/patients')
    } catch (err: any) {
      toast({ title: 'Erro ao salvar paciente', description: err.message, variant: 'destructive' })
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>

  const InputField = ({ name, label, type = 'text', maskFn, onBlur }: any) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              {...field}
              onChange={(e) => field.onChange(maskFn ? maskFn(e.target.value) : e.target.value)}
              onBlur={(e) => {
                field.onBlur()
                onBlur && onBlur(e.target.value)
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Editar Paciente' : 'Novo Paciente'}
        </h1>
        <p className="text-gray-500 mt-1">Preencha os dados do paciente nas sessões abaixo.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField name="name" label="Nome Completo *" />
              <InputField name="cpf" label="CPF" maskFn={maskCPF} />
              <InputField name="rg" label="RG" />
              <InputField name="date_of_birth" label="Data de Nascimento" type="date" />
              <InputField name="gender" label="Gênero" />
              <InputField name="marital_status" label="Estado Civil" />
              <InputField name="profession" label="Profissão" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contato e Endereço</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField name="email" label="E-mail" type="email" />
              <InputField name="phone" label="Telefone / WhatsApp" maskFn={maskPhone} />
              <InputField name="address_cep" label="CEP" maskFn={maskCEP} onBlur={handleCepBlur} />
              <InputField name="address_street" label="Logradouro" />
              <InputField name="address_number" label="Número" />
              <InputField name="address_neighborhood" label="Bairro" />
              <InputField name="address_city" label="Cidade" />
              <InputField name="address_state" label="Estado (UF)" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contato de Emergência</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField name="emergency_contact_name" label="Nome *" />
              <InputField name="emergency_contact_phone" label="Telefone *" maskFn={maskPhone} />
              <InputField name="emergency_contact_relation" label="Parentesco *" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clínico</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField name="health_insurance" label="Convênio Médico" />
              <InputField name="referred_by" label="Encaminhado por" />
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="clinical_history"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Histórico Clínico</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>LGPD e Consentimentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="consent_form_signed"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel>
                        Autorizo o armazenamento dos meus dados de saúde conforme a LGPD{' '}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ai_consent"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel>
                        Autorizo o processamento das minhas evoluções por Inteligência Artificial
                        (Opcional)
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações Internas</CardTitle>
              <CardDescription>Apenas para controle do psicólogo.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" type="button" onClick={() => navigate('/patients')}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
              Salvar Paciente
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
