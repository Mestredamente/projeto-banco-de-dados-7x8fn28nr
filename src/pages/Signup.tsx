import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/system/Input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

function validateCPF(cpf: string) {
  cpf = cpf.replace(/[^\d]+/g, '')
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false
  let sum = 0,
    rest
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(cpf.substring(9, 10))) return false
  sum = 0
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(cpf.substring(10, 11))) return false
  return true
}

export default function Signup() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [isAdmin, setIsAdmin] = useState(false)
  const [clinicName, setClinicName] = useState('')

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    cpf: '',
    crp: '',
    phone: '',
    acceptedTerms: false,
    acceptedLgpd: false,
    ccName: '',
    ccNumber: '',
    ccExpiry: '',
    ccCvv: '',
  })

  const updateForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 2) {
      if (!validateCPF(form.cpf)) {
        toast({ title: 'Atenção', description: 'CPF inválido.', variant: 'destructive' })
        return
      }
      // Permite de 4 a 7 dígitos após a barra para abranger todas as variações de CRP
      const crpValid = /^\d{2}\/\d{4,7}$/.test(form.crp)
      if (!crpValid) {
        toast({
          title: 'Atenção',
          description: 'CRP deve estar no formato XX/XXXXX.',
          variant: 'destructive',
        })
        return
      }
      if (isAdmin && !clinicName.trim()) {
        toast({
          title: 'Atenção',
          description: 'Nome da Clínica é obrigatório.',
          variant: 'destructive',
        })
        return
      }
    }
    setStep((s) => s + 1)
  }

  const handleBack = () => setStep((s) => s - 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.acceptedTerms || !form.acceptedLgpd) {
      toast({
        title: 'Atenção',
        description: 'Você deve aceitar os termos e a LGPD.',
        variant: 'destructive',
      })
      return
    }
    setLoading(true)
    const { error } = await signUp({
      ...form,
      role: isAdmin ? 'admin_clinica' : 'psicologo_autonomo',
      clinic_name: isAdmin ? clinicName : undefined,
    })
    setLoading(false)

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a conta. Verifique os dados.',
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Sucesso', description: 'Conta criada com sucesso! Bem-vindo.' })
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg shadow-lg border-t-4 border-t-teal-500">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Nova Conta</CardTitle>
          <CardDescription>Crie sua conta e teste grátis por 30 dias</CardDescription>
        </CardHeader>
        <form onSubmit={step === 3 ? handleSubmit : handleNext}>
          <CardContent className="space-y-4">
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-semibold text-lg border-b pb-2">1. Credenciais</h3>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={updateForm}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={updateForm}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-semibold text-lg border-b pb-2">2. Dados Profissionais</h3>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" name="name" required value={form.name} onChange={updateForm} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      required
                      value={form.cpf}
                      onChange={updateForm}
                      placeholder="000.000.000-00"
                      mask="cpf"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crp">CRP</Label>
                    <Input
                      id="crp"
                      name="crp"
                      required
                      value={form.crp}
                      onChange={updateForm}
                      placeholder="00/00000"
                      mask="crp"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    required
                    value={form.phone}
                    onChange={updateForm}
                    placeholder="(00) 00000-0000"
                    mask="phone"
                  />
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isAdmin"
                      checked={isAdmin}
                      onCheckedChange={(c) => setIsAdmin(c as boolean)}
                    />
                    <Label htmlFor="isAdmin">Sou administrador de clínica</Label>
                  </div>
                  {isAdmin && (
                    <div className="space-y-2 animate-fade-in">
                      <Label htmlFor="clinicName">Nome da Clínica</Label>
                      <Input
                        id="clinicName"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-semibold text-lg border-b pb-2">3. Assinatura & Termos</h3>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm text-blue-800 dark:text-blue-200">
                  <strong>Direito de arrependimento em 7 dias:</strong> Você pode cancelar sua
                  assinatura nos primeiros 7 dias sem qualquer cobrança. Após 30 dias de teste
                  grátis, o plano será renovado automaticamente.
                </div>

                <div className="space-y-2">
                  <Label>Cartão de Crédito (para ativação do trial)</Label>
                  <Input
                    name="ccName"
                    placeholder="Nome impresso no Cartão"
                    required
                    value={form.ccName}
                    onChange={updateForm}
                  />
                  <Input
                    name="ccNumber"
                    placeholder="Número do Cartão"
                    required
                    value={form.ccNumber}
                    onChange={updateForm}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="ccExpiry"
                      placeholder="MM/AA"
                      required
                      value={form.ccExpiry}
                      onChange={updateForm}
                    />
                    <Input
                      name="ccCvv"
                      placeholder="CVV"
                      required
                      value={form.ccCvv}
                      onChange={updateForm}
                    />
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={form.acceptedTerms}
                      onCheckedChange={(c) =>
                        setForm((p) => ({ ...p, acceptedTerms: c as boolean }))
                      }
                    />
                    <Label htmlFor="terms" className="text-sm font-normal leading-tight">
                      Li e aceito a{' '}
                      <a href="#" className="text-teal-600 underline">
                        Política de Privacidade
                      </a>{' '}
                      e os{' '}
                      <a href="#" className="text-teal-600 underline">
                        Termos de Uso
                      </a>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="lgpd"
                      checked={form.acceptedLgpd}
                      onCheckedChange={(c) =>
                        setForm((p) => ({ ...p, acceptedLgpd: c as boolean }))
                      }
                    />
                    <Label htmlFor="lgpd" className="text-sm font-normal leading-tight">
                      Consentimento LGPD para tratamento de dados sensíveis
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={handleBack}>
                Voltar
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                Próximo
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={loading}
              >
                {loading ? 'Processando...' : 'Criar conta gratuita por 30 dias'}
              </Button>
            )}
          </CardFooter>
        </form>
        {step === 1 && (
          <div className="px-6 pb-6 text-center text-sm text-gray-500">
            Já tem uma conta?{' '}
            <button onClick={() => navigate('/login')} className="text-teal-600 hover:underline">
              Faça login
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}
