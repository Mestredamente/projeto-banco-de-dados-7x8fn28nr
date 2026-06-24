import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export default function Settings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    crp: '',
    specializations: '',
    clinical_approach: '',
    schedule: '',
    bank: '',
    agency: '',
    account: '',
    pixKey: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        cpf: user.cpf || '',
        crp: user.crp || '',
        specializations: Array.isArray(user.specializations)
          ? user.specializations.join(', ')
          : user.specializations || '',
        clinical_approach: user.clinical_approach || '',
        schedule: user.schedule
          ? JSON.stringify(user.schedule, null, 2)
          : '{\n  "segunda": "08:00 - 18:00"\n}',
        bank: user.bank_details?.bank || '',
        agency: user.bank_details?.agency || '',
        account: user.bank_details?.account || '',
        pixKey: user.bank_details?.pixKey || '',
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let scheduleObj = {}
      try {
        scheduleObj = JSON.parse(formData.schedule || '{}')
      } catch (err) {
        toast({
          title: 'Erro de formato',
          description: 'Grade de horários deve ser um JSON válido.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const payload = {
        name: formData.name,
        phone: formData.phone,
        cpf: formData.cpf,
        crp: formData.crp,
        specializations: formData.specializations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        clinical_approach: formData.clinical_approach,
        schedule: scheduleObj,
        bank_details: {
          bank: formData.bank,
          agency: formData.agency,
          account: formData.account,
          pixKey: formData.pixKey,
        },
      }
      await pb.collection('users').update(user.id, payload)
      toast({ title: 'Sucesso', description: 'Perfil atualizado com sucesso.' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-500 mt-1">
          Gerencie seu perfil profissional e informações da conta.
        </p>
      </div>

      <Tabs defaultValue="geral" className="max-w-4xl">
        <TabsList className="mb-4 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="profissional">Profissional</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSave}>
          <TabsContent value="geral">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
                <CardDescription>Seus dados básicos de acesso.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input name="name" value={formData.name} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      name="email"
                      value={formData.email}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input name="cpf" value={formData.cpf} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input name="phone" value={formData.phone} onChange={handleChange} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profissional">
            <Card>
              <CardHeader>
                <CardTitle>Perfil Profissional</CardTitle>
                <CardDescription>Detalhes da sua atuação clínica.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Registro (CRP)</Label>
                    <Input name="crp" value={formData.crp} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Abordagem Clínica</Label>
                    <Input
                      name="clinical_approach"
                      value={formData.clinical_approach}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Especializações (separadas por vírgula)</Label>
                  <Input
                    name="specializations"
                    value={formData.specializations}
                    onChange={handleChange}
                    placeholder="Ex: TCC, Psicanálise, Terapia Infantil"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grade de Horários (Formato JSON)</Label>
                  <Textarea
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleChange}
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financeiro">
            <Card>
              <CardHeader>
                <CardTitle>Dados Financeiros</CardTitle>
                <CardDescription>Informações para recebimentos de honorários.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input name="bank" value={formData.bank} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Chave Pix</Label>
                    <Input name="pixKey" value={formData.pixKey} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Agência</Label>
                    <Input name="agency" value={formData.agency} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <Input name="account" value={formData.account} onChange={handleChange} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  )
}
