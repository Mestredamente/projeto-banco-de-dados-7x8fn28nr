import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { maskCPF, maskPhone, maskCRP } from '@/lib/masks'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    phone: '',
    crp: '',
    role: 'psicologo_autonomo',
  })

  const crpValid = form.crp.length === 0 || /^\d{2}\/\d{4,7}-\d$/.test(form.crp)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.role === 'psicologo_autonomo' || form.role === 'psicologo_vinculado') {
      if (!crpValid) {
        toast({
          title: 'CRP Inválido',
          description: 'Verifique o formato do CRP (ex: 12/34567-8)',
          variant: 'destructive',
        })
        return
      }
      if (form.crp.length === 0) {
        toast({
          title: 'CRP Obrigatório',
          description: 'Por favor, informe seu CRP.',
          variant: 'destructive',
        })
        return
      }
    }

    setLoading(true)
    try {
      const res = await signUp(form.email, form.password)
      if (res.error) throw res.error

      if (pb.authStore.record) {
        await pb.collection('users').update(pb.authStore.record.id, {
          name: form.name,
          cpf: form.cpf,
          phone: form.phone,
          crp:
            form.role === 'psicologo_autonomo' || form.role === 'psicologo_vinculado'
              ? form.crp
              : '',
          role: form.role,
        })
      }

      toast({
        title: 'Conta criada',
        description: 'Seu cadastro foi realizado com sucesso.',
      })
      navigate('/')
    } catch (err: any) {
      toast({
        title: 'Erro ao criar conta',
        description: err.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para se cadastrar na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                required
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  required
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input
                  id="phone"
                  required
                  placeholder="(00) 00000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Perfil de Uso</Label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="psicologo_autonomo">Psicólogo Autônomo</option>
                <option value="admin_clinica">Administrador de Clínica</option>
                <option value="paciente">Paciente</option>
              </select>
            </div>

            {(form.role === 'psicologo_autonomo' || form.role === 'psicologo_vinculado') && (
              <div className="space-y-2">
                <Label htmlFor="crp">CRP</Label>
                <Input
                  id="crp"
                  required={
                    form.role === 'psicologo_autonomo' || form.role === 'psicologo_vinculado'
                  }
                  value={form.crp}
                  onChange={(e) => setForm({ ...form, crp: maskCRP(e.target.value) })}
                  placeholder="12/34567-8"
                  className={
                    !crpValid && form.crp.length > 0
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }
                />
                {!crpValid && form.crp.length > 0 && (
                  <p className="text-xs text-destructive">
                    O formato do CRP deve ser semelhante a 12/34567-8
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={loading || (!crpValid && form.crp.length > 0)}
            >
              {loading ? 'Cadastrando...' : 'Criar Conta'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Faça login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
