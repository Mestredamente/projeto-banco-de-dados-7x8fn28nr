import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useBranding } from '@/hooks/use-branding'

const signupSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    passwordConfirm: z.string().min(8, 'Confirmação de senha deve ter pelo menos 8 caracteres'),
    role: z.enum(['psicologo_autonomo', 'admin_clinica', 'psicologo_vinculado', 'secretaria'], {
      required_error: 'Selecione um perfil',
    }),
    crp: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{2}\/\d{4,7}-\d$/.test(val), {
        message: 'CRP inválido. Formato: 00/000000-0',
      }),
    clinic_name: z.string().optional(),
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

type SignupFormValues = z.infer<typeof signupSchema>

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Use Branding hook safely to display the correct platform logo/name
  const brandingData = useBranding()
  const logo =
    brandingData?.logoUrl || brandingData?.branding?.logo_url || brandingData?.branding?.logo
  const company = brandingData?.companyName || brandingData?.branding?.company_name || 'Plataforma'

  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
      role: 'psicologo_autonomo',
      crp: '',
      clinic_name: '',
      acceptedTerms: false,
      acceptedLgpd: false,
    },
  })

  const role = form.watch('role')
  const needsCrp = role === 'psicologo_autonomo' || role === 'psicologo_vinculado'
  const needsClinicName = role === 'admin_clinica'

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true)
    try {
      const { error } = await signUp(data)

      if (error) {
        const fieldErrors = extractFieldErrors(error)
        if (Object.keys(fieldErrors).length > 0) {
          for (const [field, msg] of Object.entries(fieldErrors)) {
            // Check if field is part of our form schema
            if (field in data) {
              form.setError(field as any, { message: msg })
            }
          }
          toast({
            variant: 'destructive',
            title: 'Verifique os campos',
            description: 'Alguns dados informados são inválidos ou já estão em uso.',
          })
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro no cadastro',
            description: error?.message || 'Ocorreu um erro ao tentar criar sua conta.',
          })
        }
        return
      }

      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Sua conta foi criada. Redirecionando...',
      })

      navigate('/dashboard')
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: err?.message || 'Tente novamente mais tarde.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          {logo ? (
            <img src={logo} alt={company} className="h-16 object-contain" />
          ) : (
            <h1 className="text-3xl font-bold">{company}</h1>
          )}
        </div>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
            <CardDescription className="text-center">
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
                      <FormLabel>Nome Completo</FormLabel>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
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
                          <Input type="password" placeholder="******" {...field} />
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
                      <FormLabel>Perfil de Uso</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um perfil" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="psicologo_autonomo">Psicólogo Autônomo</SelectItem>
                          <SelectItem value="admin_clinica">Administrador de Clínica</SelectItem>
                          <SelectItem value="psicologo_vinculado">Psicólogo Vinculado</SelectItem>
                          <SelectItem value="secretaria">Secretária</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {needsCrp && (
                  <FormField
                    control={form.control}
                    name="crp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CRP</FormLabel>
                        <FormControl>
                          <Input placeholder="00/000000-0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {needsClinicName && (
                  <FormField
                    control={form.control}
                    name="clinic_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Clínica</FormLabel>
                        <FormControl>
                          <Input placeholder="Sua Clínica" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="acceptedTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal">
                          Aceito os{' '}
                          <Link
                            to="/termos"
                            target="_blank"
                            className="text-primary hover:underline"
                          >
                            termos de uso
                          </Link>
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptedLgpd"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal">
                          Li e concordo com a{' '}
                          <Link
                            to="/privacidade"
                            target="_blank"
                            className="text-primary hover:underline"
                          >
                            política de privacidade
                          </Link>
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Cadastrando...' : 'Criar Conta'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Fazer login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
