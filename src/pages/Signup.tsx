import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2 } from 'lucide-react'

// Custom mask for CRP (e.g., 00/000000 or 00/00000)
const applyCrpMask = (value: string) => {
  if (!value) return ''
  const numericValue = value.replace(/\D/g, '')
  if (numericValue.length <= 2) return numericValue
  return `${numericValue.slice(0, 2)}/${numericValue.slice(2, 8)}`
}

const signupSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    passwordConfirm: z.string().min(8, 'A confirmação de senha deve ter no mínimo 8 caracteres'),
    role: z.enum(['psicologo_autonomo', 'admin_clinica'], {
      required_error: 'Selecione um perfil',
    }),
    crp: z.string().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  })
  .refine(
    (data) => {
      if (data.role === 'psicologo_autonomo') {
        return !!data.crp && data.crp.replace(/\D/g, '').length >= 4
      }
      return true
    },
    {
      message: 'CRP é obrigatório para psicólogos',
      path: ['crp'],
    },
  )

type SignupFormValues = z.infer<typeof signupSchema>

export default function Signup() {
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
      role: 'psicologo_autonomo',
      crp: '',
    },
  })

  const selectedRole = form.watch('role')

  const onSubmit = async (values: SignupFormValues) => {
    setLoading(true)

    try {
      // Create auth record
      const { error } = await signUp(values.email, values.password)

      if (error) {
        toast({
          title: 'Erro no cadastro',
          description:
            error?.message ||
            'Não foi possível realizar o cadastro. O e-mail pode já estar em uso.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      // Update additional profile fields
      if (pb.authStore.record) {
        await pb.collection('users').update(pb.authStore.record.id, {
          name: values.name,
          role: values.role,
          crp: values.role === 'psicologo_autonomo' ? values.crp : null,
          is_active: true,
        })
      }

      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Seja bem-vindo(a) ao Syntra.',
      })
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Signup error:', err)
      toast({
        title: 'Aviso',
        description: 'Conta criada, mas houve um erro ao salvar o perfil.',
        variant: 'destructive',
      })
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-0 ring-1 ring-gray-200 dark:ring-gray-800 animate-fade-in-up">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="h-14 w-14 bg-teal-600 rounded-2xl flex items-center justify-center shadow-sm">
              <span className="text-white text-2xl font-bold">S</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Criar uma conta
          </CardTitle>
          <CardDescription className="text-gray-500">
            Preencha seus dados para começar a usar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu nome"
                        {...field}
                        disabled={loading}
                        className="h-11"
                      />
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
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                        disabled={loading}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual o seu perfil?</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione um perfil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="psicologo_autonomo">Psicólogo(a)</SelectItem>
                        <SelectItem value="admin_clinica">Administrador(a) de Clínica</SelectItem>
                        {/* A opção 'paciente' foi removida para forçar o uso do fluxo de convite exclusivo */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedRole === 'psicologo_autonomo' && (
                <FormField
                  control={form.control}
                  name="crp"
                  render={({ field }) => (
                    <FormItem className="animate-fade-in">
                      <FormLabel>Número do CRP</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00/000000"
                          {...field}
                          onChange={(e) => field.onChange(applyCrpMask(e.target.value))}
                          disabled={loading}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} disabled={loading} className="h-11" />
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
                      <FormLabel>Confirmar senha</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} disabled={loading} className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Cadastrar'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="text-sm text-center text-gray-500">
            Já possui uma conta?{' '}
            <Link
              to="/login"
              className="text-teal-600 hover:text-teal-700 font-medium hover:underline transition-colors"
            >
              Fazer login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
