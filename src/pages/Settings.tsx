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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  ShieldCheck,
  AlertTriangle,
  Plus,
  X,
  ExternalLink,
  CheckCircle2,
  DollarSign,
  MessageCircle,
  Mail,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'

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

const DEFAULT_TRIGGERS = {
  lembrete: true,
  cobranca: true,
  confirmacao: true,
  portal_full_access: true,
  portal_active: true,
  auto_detect_crisis: true,
  channel: 'ambos',
  custom_keywords: ['suicídio', 'matar', 'morrer', 'sumir', 'automutilação', 'cortar', 'sangrar'],
}

const DEFAULT_TEMPLATES = {
  lembrete: '[PACIENTE], lembre-se da sua sessão amanhã às [HORÁRIO].',
  cobranca: '[PACIENTE], sua cobrança de [VALOR] vence em [DATA].',
  confirmacao: '[PACIENTE], confirme sua sessão de [DATA] às [HORÁRIO].',
}

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

  const [notificationSettings, setNotificationSettings] = useState({
    id: '',
    triggers: DEFAULT_TRIGGERS,
    reminder_time: '24',
    templates: DEFAULT_TEMPLATES,
  })

  const [newKeyword, setNewKeyword] = useState('')
  const [notificationLogs, setNotificationLogs] = useState<any[]>([])
  const [simulateCrisisOpen, setSimulateCrisisOpen] = useState(false)
  const [simulatedText, setSimulatedText] = useState('')
  const [simulatedAlert, setSimulatedAlert] = useState<{ trigger: string } | null>(null)

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

      loadNotificationData()
    }
  }, [user])

  const loadNotificationData = async () => {
    try {
      const res = await pb.collection('notification_settings').getFirstListItem(`user="${user.id}"`)
      setNotificationSettings({
        id: res.id,
        triggers: { ...DEFAULT_TRIGGERS, ...(res.triggers || {}) },
        reminder_time: res.reminder_time || '24',
        templates: { ...DEFAULT_TEMPLATES, ...(res.templates || {}) },
      })
    } catch (err) {
      // Keep defaults
    }

    try {
      const logs = await pb.collection('notifications').getList(1, 10, {
        filter: `profile="${user.id}"`,
        expand: 'patient',
        sort: '-created',
      })
      setNotificationLogs(logs.items)
    } catch (err) {
      console.error(err)
    }
  }

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

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      setNotificationSettings((p) => ({
        ...p,
        triggers: {
          ...p.triggers,
          custom_keywords: [...(p.triggers.custom_keywords || []), newKeyword.trim().toLowerCase()],
        },
      }))
      setNewKeyword('')
    }
  }

  const handleRemoveKeyword = (kw: string) => {
    setNotificationSettings((p) => ({
      ...p,
      triggers: {
        ...p.triggers,
        custom_keywords: (p.triggers.custom_keywords || []).filter((k: string) => k !== kw),
      },
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const reminderNum = parseInt(notificationSettings.reminder_time, 10)
    if (isNaN(reminderNum) || reminderNum < 0) {
      toast({ title: 'Erro', description: 'Horário de disparo inválido.', variant: 'destructive' })
      return
    }

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

      const nsPayload = {
        user: user.id,
        triggers: notificationSettings.triggers,
        reminder_time: String(reminderNum),
        templates: notificationSettings.templates,
      }

      if (notificationSettings.id) {
        await pb.collection('notification_settings').update(notificationSettings.id, nsPayload)
      } else {
        const created = await pb.collection('notification_settings').create(nsPayload)
        setNotificationSettings((prev) => ({ ...prev, id: created.id }))
      }

      toast({ title: 'Sucesso', description: 'Configurações atualizadas com sucesso.' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as configurações.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const runSimulation = () => {
    const content = simulatedText.toLowerCase()
    const systemTriggers =
      notificationSettings.triggers.custom_keywords || DEFAULT_TRIGGERS.custom_keywords
    const normalizedContent = ' ' + content.replace(/[.,!?\n\r]/g, ' ') + ' '
    let detectedTrigger = null
    for (const trigger of systemTriggers) {
      if (normalizedContent.includes(' ' + trigger + ' ')) {
        detectedTrigger = trigger
        break
      }
    }
    if (detectedTrigger) {
      setSimulatedAlert({ trigger: detectedTrigger })
    } else {
      toast({
        title: 'Nenhum gatilho detectado',
        description: 'O texto não acionou nenhum alerta de crise.',
      })
      setSimulatedAlert(null)
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
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Configurações do Sistema
        </h1>
        <p className="text-gray-500 mt-1">
          Gerencie seu perfil profissional, preferências de comunicação e integrações.
        </p>
      </div>

      <Tabs defaultValue="perfil" className="max-w-5xl">
        <TabsList className="mb-6 bg-gray-100 dark:bg-gray-800 flex flex-wrap h-auto">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="portal">Portal do Paciente</TabsTrigger>
          <TabsTrigger value="seguranca">Crise e Segurança</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSave}>
          <TabsContent value="perfil" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Meu Perfil</CardTitle>
                  <CardDescription>Informações básicas e dados profissionais.</CardDescription>
                </div>
                {user?.role === 'admin_clinica' && (
                  <Link to="/clinic-profile">
                    <Button variant="outline" type="button" className="gap-2">
                      Perfil da Clínica <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
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
                      className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
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

                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="space-y-2 md:col-span-2">
                    <Label>Especializações (separadas por vírgula)</Label>
                    <Input
                      name="specializations"
                      value={formData.specializations}
                      onChange={handleChange}
                      placeholder="Ex: TCC, Psicanálise, Terapia Infantil"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <Label className="text-base font-semibold">Grade de Horários</Label>
                    <div className="flex flex-wrap gap-2">
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
                        className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-2 rounded"
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

          <TabsContent value="notificacoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comunicações Automáticas</CardTitle>
                <CardDescription>
                  Configure envios de lembretes, cobranças e confirmações de consultas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border p-3 rounded-md bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <span className="text-sm font-medium block">Lembretes de Sessão</span>
                      <span className="text-xs text-gray-500">
                        Enviado antes de cada atendimento
                      </span>
                    </div>
                    <Switch
                      checked={notificationSettings.triggers.lembrete ?? true}
                      onCheckedChange={(c) =>
                        setNotificationSettings((p) => ({
                          ...p,
                          triggers: { ...p.triggers, lembrete: c },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between border p-3 rounded-md bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <span className="text-sm font-medium block">Avisos de Cobrança</span>
                      <span className="text-xs text-gray-500">Notifica sobre vencimentos</span>
                    </div>
                    <Switch
                      checked={notificationSettings.triggers.cobranca ?? true}
                      onCheckedChange={(c) =>
                        setNotificationSettings((p) => ({
                          ...p,
                          triggers: { ...p.triggers, cobranca: c },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between border p-3 rounded-md bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <span className="text-sm font-medium block">Pedidos de Confirmação</span>
                      <span className="text-xs text-gray-500">
                        Solicita confirmação de presença
                      </span>
                    </div>
                    <Switch
                      checked={notificationSettings.triggers.confirmacao ?? true}
                      onCheckedChange={(c) =>
                        setNotificationSettings((p) => ({
                          ...p,
                          triggers: { ...p.triggers, confirmacao: c },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="space-y-2">
                    <Label>Horário de disparo (horas de antecedência)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={notificationSettings.reminder_time}
                      onChange={(e) =>
                        setNotificationSettings((p) => ({ ...p, reminder_time: e.target.value }))
                      }
                      className="w-full max-w-[200px]"
                    />
                    <p className="text-xs text-gray-500">Ex: 24 (um dia antes da sessão)</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Canal Padrão</Label>
                    <Select
                      value={notificationSettings.triggers.channel || 'ambos'}
                      onValueChange={(v) =>
                        setNotificationSettings((p) => ({
                          ...p,
                          triggers: { ...p.triggers, channel: v },
                        }))
                      }
                    >
                      <SelectTrigger className="w-full max-w-[250px]">
                        <SelectValue placeholder="Selecione o canal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-medium">Templates de Mensagem</h3>
                  <p className="text-sm text-gray-500">
                    Variáveis: <Badge variant="outline">[PACIENTE]</Badge>{' '}
                    <Badge variant="outline">[PSICÓLOGO]</Badge>{' '}
                    <Badge variant="outline">[HORÁRIO]</Badge>{' '}
                    <Badge variant="outline">[DATA]</Badge> <Badge variant="outline">[VALOR]</Badge>
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Lembrete de Sessão</Label>
                      <Textarea
                        value={
                          notificationSettings.templates.lembrete || DEFAULT_TEMPLATES.lembrete
                        }
                        onChange={(e) =>
                          setNotificationSettings((p) => ({
                            ...p,
                            templates: { ...p.templates, lembrete: e.target.value },
                          }))
                        }
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Aviso de Cobrança</Label>
                      <Textarea
                        value={
                          notificationSettings.templates.cobranca || DEFAULT_TEMPLATES.cobranca
                        }
                        onChange={(e) =>
                          setNotificationSettings((p) => ({
                            ...p,
                            templates: { ...p.templates, cobranca: e.target.value },
                          }))
                        }
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pedido de Confirmação</Label>
                      <Textarea
                        value={
                          notificationSettings.templates.confirmacao ||
                          DEFAULT_TEMPLATES.confirmacao
                        }
                        onChange={(e) =>
                          setNotificationSettings((p) => ({
                            ...p,
                            templates: { ...p.templates, confirmacao: e.target.value },
                          }))
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Logs de Notificações</CardTitle>
                <CardDescription>
                  Últimas notificações enviadas pelo sistema para seus pacientes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notificationLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          Nenhum log encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      notificationLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{format(new Date(log.created), 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell>{log.expand?.patient?.name}</TableCell>
                          <TableCell className="capitalize">{log.type.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Badge
                              variant={log.status === 'Erro' ? 'destructive' : 'default'}
                              className={
                                log.status === 'Entregue' ? 'bg-green-100 text-green-800' : ''
                              }
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Controles do Portal do Paciente</CardTitle>
                <CardDescription>
                  Defina padrões globais de visibilidade e acesso para os seus pacientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between border p-4 rounded-md bg-gray-50 dark:bg-gray-800/50">
                  <div className="space-y-0.5 max-w-[80%]">
                    <Label className="text-base">
                      Novos pacientes começam com todas as abas liberadas?
                    </Label>
                    <p className="text-sm text-gray-500">
                      Se ativado, ao cadastrar um paciente, ele já terá acesso automático às áreas
                      de diário, financeiro e evoluções no portal dele.
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.triggers.portal_full_access ?? true}
                    onCheckedChange={(c) =>
                      setNotificationSettings((p) => ({
                        ...p,
                        triggers: { ...p.triggers, portal_full_access: c },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between border p-4 rounded-md bg-gray-50 dark:bg-gray-800/50">
                  <div className="space-y-0.5 max-w-[80%]">
                    <Label className="text-base">Ativar/desativar portal</Label>
                    <p className="text-sm text-gray-500">
                      Chave mestre para habilitar ou suspender o acesso ao portal para toda a sua
                      base de pacientes simultaneamente.
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.triggers.portal_active ?? true}
                    onCheckedChange={(c) =>
                      setNotificationSettings((p) => ({
                        ...p,
                        triggers: { ...p.triggers, portal_active: c },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seguranca" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Crise e Segurança</CardTitle>
                <CardDescription>
                  Configure alertas e palavras-gatilho para o Prontuário Inteligente e Diário de
                  Sentimentos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between border p-4 rounded-md bg-gray-50 dark:bg-gray-800/50">
                  <div className="space-y-0.5 max-w-[80%]">
                    <Label className="text-base">Ativar detecção automática</Label>
                    <p className="text-sm text-gray-500">
                      A IA fará varreduras diárias em busca de indícios de risco nas anotações e
                      sentimentos reportados.
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.triggers.auto_detect_crisis ?? true}
                    onCheckedChange={(c) =>
                      setNotificationSettings((p) => ({
                        ...p,
                        triggers: { ...p.triggers, auto_detect_crisis: c },
                      }))
                    }
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base">Palavras-gatilho monitoradas</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Adicione ou remova termos que o sistema deve considerar como sinais de alerta
                    grave.
                  </p>

                  <div className="flex gap-2 max-w-sm mb-4">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Ex: machucar"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddKeyword()
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddKeyword}>
                      <Plus className="w-4 h-4 mr-2" /> Adicionar
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 p-4 border rounded-md min-h-[100px] bg-white dark:bg-gray-900">
                    {(notificationSettings.triggers.custom_keywords || []).map((kw: string) => (
                      <Badge
                        key={kw}
                        variant="secondary"
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw)}
                          className="text-gray-400 hover:text-red-500 focus:outline-none ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </Badge>
                    ))}
                    {(!notificationSettings.triggers.custom_keywords ||
                      notificationSettings.triggers.custom_keywords.length === 0) && (
                      <span className="text-sm text-gray-400 italic flex items-center h-full">
                        Nenhuma palavra-gatilho configurada.
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-600" /> Simulação de Alerta
                  </h3>
                  <p className="text-sm text-gray-500 max-w-2xl">
                    Teste o sistema de detecção utilizando o conjunto de palavras-gatilho
                    configurado acima, garantindo que os alertas estão sensíveis aos cenários
                    desejados.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-teal-200 text-teal-700 hover:bg-teal-50 mt-2"
                    onClick={() => setSimulateCrisisOpen(true)}
                  >
                    Abrir Simulador
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integracoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Painel de Integrações</CardTitle>
                <CardDescription>
                  Visão geral dos serviços externos conectados ao seu ambiente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border p-4 rounded-md bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-full shadow-sm">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">Mercado Pago / Asaas</p>
                      <p className="text-sm text-gray-500">Processamento de pagamentos e boletos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                    <CheckCircle2 className="w-4 h-4" /> Conectado
                  </div>
                </div>

                <div className="flex items-center justify-between border p-4 rounded-md bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-full shadow-sm">
                      <MessageCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">WhatsApp API</p>
                      <p className="text-sm text-gray-500">Mensageria instantânea e bots</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                    <CheckCircle2 className="w-4 h-4" /> Conectado
                  </div>
                </div>

                <div className="flex items-center justify-between border p-4 rounded-md bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-full shadow-sm">
                      <Mail className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">E-mail (SMTP/SendGrid)</p>
                      <p className="text-sm text-gray-500">Notificações e faturas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                    <CheckCircle2 className="w-4 h-4" /> Configurado
                  </div>
                </div>

                <Alert className="mt-6 bg-blue-50 border-blue-200 text-blue-800">
                  <AlertDescription>
                    Nesta versão, as integrações nativas são gerenciadas globalmente pelo
                    administrador do sistema. O seu status reflete a conectividade atual da
                    plataforma Syntra.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados Financeiros</CardTitle>
                <CardDescription>
                  Informações para recebimentos de honorários via repasses.
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

          <TabsContent value="assinatura" className="space-y-6">
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

          <div className="mt-8 flex justify-end sticky bottom-6 bg-white dark:bg-gray-900 p-4 shadow-lg rounded-xl border border-gray-100 dark:border-gray-800 z-10">
            <Button
              type="submit"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white px-8"
              size="lg"
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

      <Dialog open={simulateCrisisOpen} onOpenChange={setSimulateCrisisOpen}>
        <DialogContent className="sm:max-w-md border-t-4 border-t-red-600">
          <DialogHeader>
            <DialogTitle>Simulador de Gatilho</DialogTitle>
            <DialogDescription>
              Digite um texto para testar o detector de crises com base nas palavras-gatilho
              cadastradas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={simulatedText}
              onChange={(e) => setSimulatedText(e.target.value)}
              placeholder="Ex: Não aguento mais, vou sumir."
              rows={4}
            />
            {simulatedAlert && (
              <Alert className="bg-red-600 text-white border-red-800 animate-fade-in-down shadow-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
                <AlertTitle className="font-bold flex items-center gap-2">
                  🚨 ALERTA DE CRISE
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white text-[10px] border-white/20"
                  >
                    🔬 SIMULAÇÃO
                  </Badge>
                </AlertTitle>
                <AlertDescription className="text-red-50 mt-1">
                  Gatilho detectado: <strong>"{simulatedAlert.trigger}"</strong>
                  <br />
                  <span className="text-xs mt-2 block opacity-80">
                    (Nenhum registro ou notificação real foi gerado)
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSimulateCrisisOpen(false)
                setSimulatedAlert(null)
                setSimulatedText('')
              }}
            >
              Fechar
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={runSimulation}>
              Testar Gatilhos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
