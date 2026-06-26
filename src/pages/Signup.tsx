import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { useBranding } from '@/hooks/use-branding'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const signupSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    passwordConfirm: z.string(),
    role: z.enum(['psicologo_autonomo', 'admin_clinica'], {
      required_error: 'Selecione um tipo de perfil',
    }),
    cpf: z.string().optional().or(z.literal('')),
    crp: z.string().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    acceptedTerms: z.boolean().refine((val) => val === true, {
      message: 'Você deve aceitar os termos de uso',
    }),
    acceptedLgpd: z.boolean().refine((val) => val === true, {
      message: 'Você deve aceitar a política de privacidade',
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  })
  .refine(
    (data) => {
      if (data.role === 'psicologo_autonomo') {
        return (
          !!data.crp &&
          data.crp.replace(/\D/g, '').length >= 4 &&
          data.crp.replace(/\D/g, '').length <= 8
        )
      }
      return true
    },
    {
      message: 'CRP inválido. Deve conter entre 4 e 8 dígitos.',
      path: ['crp'],
    },
  )

type SignupFormValues = z.infer<typeof signupSchema>

export default function Signup() {
  const { signUp } = useAuth()
  const { theme } = useBranding()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
      role: 'psicologo_autonomo',
      cpf: '',
      crp: '',
      phone: '',
      acceptedTerms: false,
      acceptedLgpd: false,
    },
  })

  const selectedRole = form.watch('role')

  const onSubmit = async (data: SignupFormValues) => {
    setLoading(true)
    const { error } = await signUp(data)
    setLoading(false)

    if (error) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msg]) => {
          form.setError(field as any, { type: 'manual', message: msg as string })
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro no cadastro',
          description: getErrorMessage(error),
        })
      }
    } else {
      toast({
        title: 'Cadastro realizado!',
        description: 'Seja bem-vindo ao sistema.',
      })
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          {theme?.logo_url ? (
            <img src={theme.logo_url} alt="Logo" className="mx-auto h-12 w-auto object-contain" />
          ) : (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xl font-bold text-primary">S</span>
            </div>
          )}
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Crie sua conta</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/90">
              faça login se já tem conta
            </Link>
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Qual o seu perfil?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="psicologo_autonomo" />
                        </FormControl>
                        <FormLabel className="font-normal">Psicólogo Autônomo</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="admin_clinica" />
                        </FormControl>
                        <FormLabel className="font-normal">Administrador de Clínica</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
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
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Min. 8 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirme a senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedRole === 'psicologo_autonomo' && (
                <FormField
                  control={form.control}
                  name="crp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CRP</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu CRP (apenas números)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acceptedTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Eu aceito os{' '}
                        <a href="/termos" target="_blank" className="text-primary hover:underline">
                          Termos de Uso
                        </a>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acceptedLgpd"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Eu aceito a{' '}
                        <a
                          href="/privacidade"
                          target="_blank"
                          className="text-primary hover:underline"
                        >
                          Política de Privacidade
                        </a>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar conta
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
