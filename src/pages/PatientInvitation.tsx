import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/system/Button'
import { Input } from '@/components/system/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/system/Card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { aplicarMascara } from '@/lib/masks'

const schema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    cpf: z.string().min(14, 'CPF incompleto'),
    telefone: z.string().min(14, 'Telefone incompleto'),
    data_nascimento: z.string().min(10, 'Data inválida'),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export default function PatientInvitation() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [psychologistName, setPsychologistName] = useState('')
  const [phoneWasPreFilled, setPhoneWasPreFilled] = useState(false)
  const [cpfWasPreFilled, setCpfWasPreFilled] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      email: '',
      cpf: '',
      telefone: '',
      data_nascimento: '',
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    async function loadInvite() {
      if (!token) return
      try {
        const res = await pb.send(`/backend/v1/invitations/${token}`, { method: 'GET' })
        setPsychologistName(res.psicologo_nome)

        form.setValue('nome', res.paciente_nome || '')
        form.setValue('email', res.paciente_email || '')

        if (res.cpf) {
          form.setValue('cpf', aplicarMascara(res.cpf, 'cpf'))
          setCpfWasPreFilled(true)
        }

        if (res.data_nascimento) {
          const parts = res.data_nascimento.split('-')
          if (parts.length >= 3) {
            form.setValue('data_nascimento', `${parts[2]}/${parts[1]}/${parts[0]}`)
          }
        }

        if (res.telefone) {
          form.setValue('telefone', aplicarMascara(res.telefone, 'phone'))
          setPhoneWasPreFilled(true)
        }
      } catch (err: any) {
        toast({
          title: 'Convite inválido',
          description: 'Este convite pode ter expirado ou já foi utilizado.',
          variant: 'destructive',
        })
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    loadInvite()
  }, [token, navigate, toast, form])

  const onSubmit = async (data: FormValues) => {
    if (!token) return
    setSubmitting(true)
    try {
      const payload = {
        nome: data.nome,
        email: data.email,
        cpf: data.cpf.replace(/\D/g, ''),
        telefone: data.telefone.replace(/\D/g, ''),
        data_nascimento: data.data_nascimento.split('/').reverse().join('-'),
        password: data.password,
      }

      await pb.send(`/backend/v1/invitations/${token}/accept`, {
        method: 'POST',
        body: payload,
      })

      toast({
        title: 'Cadastro concluído',
        description: 'Sua conta foi criada com sucesso! Você pode fazer o login agora.',
      })
      navigate('/login')
    } catch (err: any) {
      if (err?.response?.message === 'USER_EXISTS' || err?.message === 'USER_EXISTS') {
        toast({
          title: 'Cadastro existente',
          description: 'Você já possui cadastro. Faça login para continuar.',
          variant: 'destructive',
        })
        navigate('/login')
        return
      }
      toast({
        title: 'Erro no cadastro',
        description: err?.response?.message || 'Verifique seus dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Complete seu Cadastro</CardTitle>
          <CardDescription className="text-center">
            Você foi convidado por <strong>{psychologistName}</strong> para acessar o portal do
            paciente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-gray-100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" readOnly className="bg-gray-100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly={cpfWasPreFilled}
                        className={cpfWasPreFilled ? 'bg-gray-100' : ''}
                        onChange={(e) => {
                          field.onChange(aplicarMascara(e.target.value, 'cpf'))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="DD/MM/AAAA"
                        onChange={(e) => {
                          field.onChange(aplicarMascara(e.target.value, 'date'))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="(00) 00000-0000"
                        readOnly={phoneWasPreFilled}
                        className={phoneWasPreFilled ? 'bg-gray-100' : ''}
                        onChange={(e) => {
                          field.onChange(aplicarMascara(e.target.value, 'phone'))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Mínimo 8 caracteres" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Confirme sua senha" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Concluir Cadastro'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
