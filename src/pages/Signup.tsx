import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/use-auth'
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
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const signupSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    passwordConfirm: z.string().min(8, 'Confirmação de senha deve ter no mínimo 8 caracteres'),
    role: z.enum([
      'psicologo_autonomo',
      'admin_clinica',
      'paciente',
      'secretaria',
      'psicologo_vinculado',
      'gestor_saas',
    ]),
    cpf: z.string().min(11, 'CPF deve conter pelo menos 11 dígitos'),
    crp: z.string().optional(),
    phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
    clinic_name: z.string().optional(),
    acceptedTerms: z.boolean().refine((val) => val === true, {
      message: 'Você deve aceitar os termos de uso',
    }),
    acceptedLgpd: z.boolean().refine((val) => val === true, {
      message: 'Você deve consentir com a política de privacidade',
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  })
  .refine(
    (data) => {
      if (['psicologo_autonomo', 'psicologo_vinculado'].includes(data.role)) {
        return !!data.crp && /^\d{2}\/\d{4,6}$/.test(data.crp)
      }
      return true
    },
    {
      message: 'CRP inválido (Formato exigido: 00/00000)',
      path: ['crp'],
    },
  )

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof signupSchema>>({
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
      clinic_name: '',
      acceptedTerms: false,
      acceptedLgpd: false,
    },
  })

  const role = form.watch('role')
  const isPsychologist = role === 'psicologo_autonomo' || role === 'psicologo_vinculado'
  const isClinicAdmin = role === 'admin_clinica'

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    setIsLoading(true)
    const { error } = await signUp(data)
    setIsLoading(false)

    if (error) {
      const fieldErrors = extractFieldErrors(error)

      Object.entries(fieldErrors).forEach(([key, msg]) => {
        if (key in data) {
          form.setError(key as any, { type: 'server', message: msg })
        }
      })

      toast({
        title: 'Erro ao criar conta',
        description: error.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Redirecionando para o sistema...',
      })
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Criar uma conta</CardTitle>
          <CardDescription>Preencha seus dados para acessar a plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
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
                        <Input type="password" placeholder="Repita a senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone (WhatsApp)</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Perfil</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione seu perfil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="psicologo_autonomo">Psicólogo(a) Autônomo(a)</SelectItem>
                        <SelectItem value="admin_clinica">Administrador(a) de Clínica</SelectItem>
                        <SelectItem value="paciente">Paciente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isPsychologist && (
                <FormField
                  control={form.control}
                  name="crp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CRP</FormLabel>
                      <FormControl>
                        <Input placeholder="00/00000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {isClinicAdmin && (
                <FormField
                  control={form.control}
                  name="clinic_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Clínica (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Sua Clínica" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="acceptedTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-card">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Li e aceito os{' '}
                          <Link to="/termos" className="text-primary hover:underline">
                            termos de uso
                          </Link>
                          .
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
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-card">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Autorizo o tratamento dos meus dados conforme a{' '}
                          <Link to="/privacidade" className="text-primary hover:underline">
                            política de privacidade
                          </Link>{' '}
                          (LGPD).
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Cadastrar'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-6">
          <div className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Fazer login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
