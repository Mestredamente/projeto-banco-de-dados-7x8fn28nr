import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { maskCPF, maskPhone } from '@/lib/utils'
import { BRAND } from '@/config/branding'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { PhoneInput } from '@/components/system/PhoneInput'
import { Input as MaskedInput } from '@/components/system/Input'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function PatientInvitation() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [invite, setInvite] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    telefone: '',
    data_nascimento: '',
  })

  useEffect(() => {
    if (!token) return
    pb.send(`/backend/v1/invitations/${token}`, { method: 'GET' })
      .then((res) => {
        setInvite(res)
        setForm((prev) => ({ ...prev, nome: res.paciente_nome, email: res.paciente_email }))
      })
      .catch((err) => setError(err.message || 'Convite inválido ou expirado.'))
      .finally(() => setLoading(false))
  }, [token])

  const validateCPF = (cpf: string) => {
    let str = cpf.replace(/[^\d]+/g, '')
    if (str.length !== 11 || !!str.match(/(\d)\1{10}/)) return false
    let sum = 0,
      rest
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(str.substring(i - 1, i)) * (11 - i)
    rest = (sum * 10) % 11
    if (rest === 10 || rest === 11) rest = 0
    if (rest !== parseInt(str.substring(9, 10))) return false
    sum = 0
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(str.substring(i - 1, i)) * (12 - i)
    rest = (sum * 10) % 11
    if (rest === 10 || rest === 11) rest = 0
    if (rest !== parseInt(str.substring(10, 11))) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast({ title: 'Atenção', description: 'As senhas não coincidem.', variant: 'destructive' })
      return
    }
    if (!validateCPF(form.cpf)) {
      toast({
        title: 'Atenção',
        description: 'O CPF informado é inválido.',
        variant: 'destructive',
      })
      return
    }
    if (form.password.length < 8) {
      toast({
        title: 'Atenção',
        description: 'A senha deve ter pelo menos 8 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      await pb.send(`/backend/v1/invitations/${token}/accept`, {
        method: 'POST',
        body: JSON.stringify({
          password: form.password,
          nome: form.nome,
          telefone: form.telefone,
          cpf: form.cpf,
          data_nascimento: form.data_nascimento,
        }),
      })

      toast({ title: 'Sucesso!', description: 'Sua conta foi criada. Entrando...' })
      await signIn(form.email, form.password)
      navigate('/patient-portal')
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Ocorreu um erro ao criar a conta.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Carregando...</p>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg rounded-[12px]">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h2 className="text-xl font-bold" style={{ fontFamily: BRAND.fontHeading }}>
              Convite Inválido
            </h2>
            <p className="text-gray-600" style={{ fontFamily: BRAND.fontBody }}>
              {error}
            </p>
            <Button
              className="mt-4 text-white"
              style={{ borderRadius: BRAND.borderRadius, backgroundColor: BRAND.corPrimary }}
              onClick={() => navigate('/login')}
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card
        className="w-full max-w-lg shadow-lg border-t-4"
        style={{ borderTopColor: BRAND.corPrimary, borderRadius: BRAND.borderRadiusCard }}
      >
        <CardHeader>
          <CardTitle className="text-2xl font-bold" style={{ fontFamily: BRAND.fontHeading }}>
            Bem-vindo(a) ao {BRAND.nome}
          </CardTitle>
          <CardDescription style={{ fontFamily: BRAND.fontBody }}>
            Olá <strong>{invite.paciente_nome}</strong>, você foi convidado por{' '}
            <strong>{invite.psicologo_nome}</strong> para criar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            style={{ fontFamily: BRAND.fontBody }}
          >
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                required
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                style={{ borderRadius: BRAND.borderRadius }}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                disabled
                value={form.email}
                className="bg-gray-100"
                style={{ borderRadius: BRAND.borderRadius }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CPF</Label>
                <MaskedInput
                  mask="cpf"
                  required
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))}
                  style={{ borderRadius: BRAND.borderRadius }}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input
                  required
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) => setForm((p) => ({ ...p, data_nascimento: e.target.value }))}
                  style={{ borderRadius: BRAND.borderRadius }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <PhoneInput
                required
                value={form.telefone}
                onChange={(val) => setForm((p) => ({ ...p, telefone: val }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  style={{ borderRadius: BRAND.borderRadius }}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Senha</Label>
                <Input
                  required
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  style={{ borderRadius: BRAND.borderRadius }}
                />
              </div>
            </div>

            <Alert className="mt-4 bg-blue-50 border-blue-200">
              <AlertDescription className="text-xs text-blue-800">
                A senha deve conter no mínimo 8 caracteres.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full mt-6 text-white"
              disabled={submitting}
              style={{
                backgroundColor: BRAND.corPrimary,
                borderRadius: BRAND.borderRadius,
                fontFamily: BRAND.fontButton,
              }}
            >
              {submitting ? 'Processando...' : 'Concluir Cadastro'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
