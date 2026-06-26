import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Briefcase, Activity } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AuditLog {
  id: string
  action: string
  created: string
  ip_address: string
  user_agent: string
  table_name?: string
}

export default function SaasProfile() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')

  const [prefs, setPrefs] = useState({
    churn_alerts: false,
    trial_expiring: false,
    new_subscribers: false,
  })

  const [prefId, setPrefId] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loginHistory, setLoginHistory] = useState<AuditLog[]>([])
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([])

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setPhone(user.phone || '')
      loadPreferences()
      loadAuditLogs()
    }
  }, [user])

  const loadPreferences = async () => {
    if (!user) return
    try {
      const records = await pb.collection('notification_settings').getList(1, 1, {
        filter: `user = "${user.id}"`,
      })
      if (records.items.length > 0) {
        const record = records.items[0]
        setPrefId(record.id)
        setPrefs({
          churn_alerts: record.triggers?.churn_alerts || false,
          trial_expiring: record.triggers?.trial_expiring || false,
          new_subscribers: record.triggers?.new_subscribers || false,
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadAuditLogs = async () => {
    if (!user) return
    try {
      const logs = await pb.collection('audit_logs').getList<AuditLog>(1, 15, {
        filter: `actor = "${user.id}"`,
        sort: '-created',
      })

      const logins = logs.items
        .filter((log) => log.action === 'login' || log.action === 'auth')
        .slice(0, 5)
      setLoginHistory(logins)

      const actions = logs.items
        .filter((log) => log.action !== 'login' && log.action !== 'auth')
        .slice(0, 10)
      setRecentActivity(actions)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSavePersonal = async () => {
    if (!user) return
    try {
      await pb.collection('users').update(user.id, {
        name,
        phone,
      })
      toast({ title: 'Sucesso', description: 'Dados pessoais atualizados com sucesso.' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleTogglePref = async (key: keyof typeof prefs) => {
    if (!user) return
    const newPrefs = { ...prefs, [key]: !prefs[key] }
    setPrefs(newPrefs)

    try {
      if (prefId) {
        await pb.collection('notification_settings').update(prefId, { triggers: newPrefs })
      } else {
        const record = await pb.collection('notification_settings').create({
          user: user.id,
          triggers: newPrefs,
        })
        setPrefId(record.id)
      }
      toast({ title: 'Sucesso', description: 'Preferências atualizadas.' })
    } catch (err: any) {
      setPrefs(prefs) // revert
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleChangePassword = async () => {
    if (!user) return
    if (!oldPassword) {
      toast({ title: 'Erro', description: 'Informe a senha atual.', variant: 'destructive' })
      return
    }
    if (password !== passwordConfirm) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' })
      return
    }
    if (password.length < 8) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter no mínimo 8 caracteres.',
        variant: 'destructive',
      })
      return
    }
    try {
      await pb.collection('users').update(user.id, {
        oldPassword,
        password,
        passwordConfirm,
      })
      setOldPassword('')
      setPassword('')
      setPasswordConfirm('')
      toast({ title: 'Sucesso', description: 'Senha alterada com sucesso.' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 11) val = val.slice(0, 11)
    if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`
    }
    if (val.length > 10) {
      val = `${val.slice(0, 10)}-${val.slice(10)}`
    }
    setPhone(val)
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Perfil do Gestor</h1>

      <Tabs defaultValue="pessoais" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 h-auto mb-6">
          <TabsTrigger value="pessoais" className="py-2.5">
            Dados Pessoais
          </TabsTrigger>
          <TabsTrigger value="empresa" className="py-2.5">
            Empresa
          </TabsTrigger>
          <TabsTrigger value="preferencias" className="py-2.5">
            Preferências
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="py-2.5">
            Segurança & Atividade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pessoais" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>
                Informações básicas da sua conta administrativa Syntrapsi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="gestor-name">Nome Completo</Label>
                <Input id="gestor-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gestor-email">E-mail</Label>
                <Input
                  id="gestor-email"
                  value={user?.email || ''}
                  disabled
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O e-mail de acesso não pode ser alterado por aqui.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gestor-phone">Telefone / WhatsApp</Label>
                <Input
                  id="gestor-phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <Button onClick={handleSavePersonal} size="lg">
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>Gerenciamento da entidade legal do SaaS Syntrapsi.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">Configurações Fiscais e Institucionais</h3>
              <p className="mb-8 text-muted-foreground max-w-md">
                Acesse o painel central para gerenciar informações fiscais, logomarca, endereço e
                integrações da plataforma.
              </p>
              <Button asChild size="lg">
                <Link to="/gestao/configuracoes">Acessar Configurações do Sistema</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferencias">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure quais alertas críticos de negócio você deseja receber no seu e-mail.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between border-b pb-4">
                <div className="space-y-1">
                  <Label className="text-base">Alertas de Churn</Label>
                  <p className="text-sm text-muted-foreground">
                    Seja notificado imediatamente quando um cliente cancelar a assinatura ativa.
                  </p>
                </div>
                <Switch
                  checked={prefs.churn_alerts}
                  onCheckedChange={() => handleTogglePref('churn_alerts')}
                />
              </div>
              <div className="flex items-start justify-between border-b pb-4">
                <div className="space-y-1">
                  <Label className="text-base">Trials Expirando</Label>
                  <p className="text-sm text-muted-foreground">
                    Resumo diário contendo as clínicas que estão em fim de período de teste.
                  </p>
                </div>
                <Switch
                  checked={prefs.trial_expiring}
                  onCheckedChange={() => handleTogglePref('trial_expiring')}
                />
              </div>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Novos Assinantes</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba um alerta de comemoração a cada nova conversão de plano pago no sistema.
                  </p>
                </div>
                <Switch
                  checked={prefs.new_subscribers}
                  onCheckedChange={() => handleTogglePref('new_subscribers')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Alterar Senha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                  />
                </div>
                <Button onClick={handleChangePassword} className="w-full">
                  Atualizar Senha
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock size={16} className="text-primary" /> Histórico de Sessões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loginHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum login registrado recentemente no log de auditoria.
                    </p>
                  ) : (
                    <ul className="space-y-4">
                      {loginHistory.map((log) => (
                        <li key={log.id} className="text-sm border-l-2 border-primary/40 pl-3">
                          <p className="font-medium">
                            {new Date(log.created).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-muted-foreground">
                            IP: {log.ip_address || 'Desconhecido'} <br /> Dispositivo:{' '}
                            {log.user_agent
                              ? log.user_agent.length > 30
                                ? log.user_agent.substring(0, 30) + '...'
                                : log.user_agent
                              : 'Desconhecido'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity size={16} className="text-primary" /> Atividade Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma atividade administrativa recente.
                    </p>
                  ) : (
                    <ul className="space-y-4">
                      {recentActivity.map((log) => (
                        <li key={log.id} className="text-sm border-l-2 border-primary/40 pl-3">
                          <p className="font-medium capitalize">
                            {log.action.replace(/_/g, ' ')}{' '}
                            {log.table_name ? `em ${log.table_name}` : ''}
                          </p>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {new Date(log.created).toLocaleString('pt-BR')}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
