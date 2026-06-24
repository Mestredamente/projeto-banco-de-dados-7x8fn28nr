import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

const APPROACHES = ['TCC', 'Psicanálise', 'Gestalt', 'Humanista', 'Comportamental', 'Outra']
const BANKS = ['Banco do Brasil', 'Itaú', 'Bradesco', 'Santander', 'Nubank', 'Caixa', 'Outro']
const PIX_TYPES = ['CPF', 'CNPJ', 'E-mail', 'Telefone', 'Aleatória']
const DAYS = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
]

export default function Settings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    crp: '',
    specializations: '',
    clinical_approach: '',
    bank: '',
    agency: '',
    account: '',
    pixType: 'CPF',
    pixKey: '',
  })

  const [schedule, setSchedule] = useState<
    Record<string, { active: boolean; start: string; end: string }>
  >({})

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
        bank: user.bank_details?.bank || '',
        agency: user.bank_details?.agency || '',
        account: user.bank_details?.account || '',
        pixType: user.bank_details?.pixType || 'CPF',
        pixKey: user.bank_details?.pixKey || '',
      })

      const sch = user.schedule || {}
      const parsedSch: any = {}
      DAYS.forEach((d) => {
        parsedSch[d.key] = sch[d.key] || { active: false, start: '08:00', end: '18:00' }
      })
      setSchedule(parsedSch)
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((p) => ({ ...p, [name]: value }))
  }

  const applySchedulePreset = (preset: 'fds' | 'noturno' | 'madrugada') => {
    const newSch = { ...schedule }
    if (preset === 'fds') {
      DAYS.forEach((d) => {
        newSch[d.key] = { ...newSch[d.key], active: d.key === 'sabado' || d.key === 'domingo' }
      })
    } else if (preset === 'noturno') {
      DAYS.forEach((d) => {
        if (newSch[d.key].active) {
          newSch[d.key].start = '18:00'
          newSch[d.key].end = '22:00'
        }
      })
    } else if (preset === 'madrugada') {
      DAYS.forEach((d) => {
        if (newSch[d.key].active) {
          newSch[d.key].start = '22:00'
          newSch[d.key].end = '06:00'
        }
      })
    }
    setSchedule(newSch)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
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
        schedule,
        bank_details: {
          bank: formData.bank,
          agency: formData.agency,
          account: formData.account,
          pixType: formData.pixType,
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

  const handleCancelSubscription = async () => {
    setCancelLoading(true)
    try {
      await pb.send('/backend/v1/subscriptions/cancel', { method: 'POST' })
      toast({
        title: 'Assinatura cancelada',
        description: 'Sua assinatura foi cancelada com sucesso.',
      })
      setCancelOpen(false)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao cancelar assinatura.',
        variant: 'destructive',
      })
    } finally {
      setCancelLoading(false)
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
        <TabsList className="mb-4 bg-gray-100 dark:bg-gray-800 flex flex-wrap h-auto">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="profissional">Profissional</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSave}>
          <TabsContent value="geral">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
                <CardDescription>Seus dados básicos de acesso.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Registro (CRP)</Label>
                    <Input
                      name="crp"
                      value={formData.crp}
                      onChange={handleChange}
                      placeholder="XX/XXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Abordagem Clínica</Label>
                    <Select
                      value={formData.clinical_approach}
                      onValueChange={(v) => handleSelectChange('clinical_approach', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a abordagem" />
                      </SelectTrigger>
                      <SelectContent>
                        {APPROACHES.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">Grade de Horários</Label>
                    <div className="space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applySchedulePreset('fds')}
                      >
                        Finais de semana
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applySchedulePreset('noturno')}
                      >
                        Noturno
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applySchedulePreset('madrugada')}
                      >
                        Madrugada
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {DAYS.map((day) => (
                      <div
                        key={day.key}
                        className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-2 rounded"
                      >
                        <Checkbox
                          checked={schedule[day.key]?.active || false}
                          onCheckedChange={(c) =>
                            setSchedule((p) => ({
                              ...p,
                              [day.key]: { ...p[day.key], active: !!c },
                            }))
                          }
                        />
                        <span className="w-32 text-sm font-medium">{day.label}</span>
                        <Input
                          type="time"
                          disabled={!schedule[day.key]?.active}
                          value={schedule[day.key]?.start || '08:00'}
                          onChange={(e) =>
                            setSchedule((p) => ({
                              ...p,
                              [day.key]: { ...p[day.key], start: e.target.value },
                            }))
                          }
                          className="w-32 h-8"
                        />
                        <span className="text-gray-500">até</span>
                        <Input
                          type="time"
                          disabled={!schedule[day.key]?.active}
                          value={schedule[day.key]?.end || '18:00'}
                          onChange={(e) =>
                            setSchedule((p) => ({
                              ...p,
                              [day.key]: { ...p[day.key], end: e.target.value },
                            }))
                          }
                          className="w-32 h-8"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financeiro">
            <Card>
              <CardHeader>
                <CardTitle>Dados Financeiros</CardTitle>
                <CardDescription>
                  Informações para recebimentos de honorários (opcional).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Select
                      value={formData.bank}
                      onValueChange={(v) => handleSelectChange('bank', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANKS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Agência</Label>
                      <Input name="agency" value={formData.agency} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>Conta com dígito</Label>
                      <Input name="account" value={formData.account} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Chave Pix</Label>
                    <Select
                      value={formData.pixType}
                      onValueChange={(v) => handleSelectChange('pixType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de chave" />
                      </SelectTrigger>
                      <SelectContent>
                        {PIX_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Chave Pix</Label>
                    <Input
                      name="pixKey"
                      value={formData.pixKey}
                      onChange={handleChange}
                      placeholder="Insira a chave Pix"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assinatura">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Cancelar Assinatura</CardTitle>
                <CardDescription>Gerencie o encerramento do seu plano.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  O cancelamento em até 7 dias após a inscrição garante estorno integral. Após esse
                  período, seu acesso permanece ativo até o fim do ciclo atual.
                </p>
                <Button type="button" variant="destructive" onClick={() => setCancelOpen(true)}>
                  Cancelar assinatura
                </Button>
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

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cancelamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar sua assinatura? Você perderá acesso a recursos
              exclusivos conforme a nossa política.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
            >
              {cancelLoading ? 'Cancelando...' : 'Sim, quero cancelar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
