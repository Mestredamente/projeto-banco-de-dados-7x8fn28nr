import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Copy, RefreshCw, Link as LinkIcon, Loader2, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PatientPreferencesTabProps {
  patientId: string
}

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function PatientPreferencesTab({ patientId }: PatientPreferencesTabProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [patient, setPatient] = useState<any>(null)
  const [activeToken, setActiveToken] = useState<string>('')

  const [formData, setFormData] = useState({
    horario_preferencial: '',
    dias_preferidos: [] as string[],
    forma_pagamento: '',
    status_paciente: 'ativo',
    observacoes_adicionais: '',
    contato_emergencia: '',
    indicacao: '',
  })

  useEffect(() => {
    if (patientId) {
      loadData()
    }
  }, [patientId])

  const loadData = async () => {
    try {
      setLoading(true)
      const p = await pb.collection('patients').getOne(patientId)
      setPatient(p)

      setFormData({
        horario_preferencial: p.horario_preferencial || '',
        dias_preferidos: p.dias_preferidos || [],
        forma_pagamento: p.forma_pagamento || '',
        status_paciente: p.status_paciente || 'ativo',
        observacoes_adicionais: p.observacoes_adicionais || '',
        contato_emergencia: p.contato_emergencia || '',
        indicacao: p.indicacao || '',
      })

      const invites = await pb.collection('convites_paciente').getList(1, 1, {
        filter: `patient="${patientId}" && status="ativo"`,
        sort: '-created',
      })
      if (invites.items.length > 0) {
        setActiveToken(invites.items[0].token)
      } else {
        setActiveToken('')
      }
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do paciente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await pb.collection('patients').update(patientId, formData)
      toast({ title: 'Sucesso', description: 'Preferências salvas com sucesso.' })
      await loadData()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro', description: 'Falha ao salvar preferências.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateLink = async () => {
    try {
      setGenerating(true)

      // Invalidate previous active tokens
      const activeInvites = await pb.collection('convites_paciente').getFullList({
        filter: `patient="${patientId}" && status="ativo"`,
      })
      for (const invite of activeInvites) {
        await pb.collection('convites_paciente').update(invite.id, { status: 'cancelado' })
      }

      const token =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const expiration = new Date()
      expiration.setDate(expiration.getDate() + 7)

      await pb.collection('convites_paciente').create({
        psicologo_id: user.id,
        paciente_email: patient.email || 'sem-email@teste.com',
        paciente_nome: patient.name,
        token: token,
        status: 'ativo',
        data_expiracao: expiration.toISOString(),
        patient: patientId,
      })

      await pb.collection('patients').update(patientId, {
        status_convite: 'pendente',
      })

      setActiveToken(token)
      setPatient({ ...patient, status_convite: 'pendente' })

      toast({ title: 'Sucesso', description: 'Link de convite gerado com sucesso.' })
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro', description: 'Falha ao gerar link.', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = () => {
    const url = `https://syntrapsi.goskip.app/convite/${activeToken}`
    navigator.clipboard.writeText(url)
    toast({ title: 'Copiado!', description: 'Link copiado para a área de transferência.' })
  }

  const toggleDia = (dia: string) => {
    setFormData((prev) => {
      const atual = prev.dias_preferidos || []
      if (atual.includes(dia)) {
        return { ...prev, dias_preferidos: atual.filter((d) => d !== dia) }
      } else {
        return { ...prev, dias_preferidos: [...atual, dia] }
      }
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Convite de Acesso</CardTitle>
              <CardDescription>
                Gere um link único para o paciente acessar o portal.
              </CardDescription>
            </div>
            {patient?.status_convite === 'pendente' && (
              <Badge
                variant="outline"
                className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300"
              >
                Pendente
              </Badge>
            )}
            {patient?.status_convite === 'aceito' && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 hover:bg-green-100 border-green-300"
              >
                Aceito
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activeToken ? (
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border border-dashed">
              <LinkIcon className="h-8 w-8 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                Gere um link para que este paciente possa criar sua conta e acessar o portal.
              </p>
              <Button onClick={handleGenerateLink} disabled={generating}>
                {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar Link de Convite
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  readOnly
                  value={`https://syntrapsi.goskip.app/convite/${activeToken}`}
                  className="bg-muted font-mono text-sm"
                />
                <Button variant="secondary" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
              </div>
              {patient?.status_convite === 'pendente' && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={handleGenerateLink}
                    disabled={generating}
                    className="text-muted-foreground"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                    Reenviar Link (Gerar Novo)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências e Dados Administrativos</CardTitle>
          <CardDescription>
            Gerencie informações de agenda, pagamento e status clínico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Status do Paciente *</Label>
              <Select
                value={formData.status_paciente}
                onValueChange={(v) => setFormData({ ...formData, status_paciente: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="avaliacao">Em Avaliação</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="transferido">Transferido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Forma de Pagamento</Label>
              <Select
                value={formData.forma_pagamento}
                onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="particular">Particular</SelectItem>
                  <SelectItem value="convenio">Convênio</SelectItem>
                  <SelectItem value="plano">Plano de Saúde</SelectItem>
                  <SelectItem value="a_definir">A definir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Preferência de Horário</Label>
              <Select
                value={formData.horario_preferencial}
                onValueChange={(v) => setFormData({ ...formData, horario_preferencial: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manha">Manhã (8h-12h)</SelectItem>
                  <SelectItem value="tarde">Tarde (12h-18h)</SelectItem>
                  <SelectItem value="noite">Noite (18h-22h)</SelectItem>
                  <SelectItem value="indiferente">Indiferente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Dias da Semana Preferidos</Label>
            <div className="flex flex-wrap gap-4 pt-2">
              {DIAS_SEMANA.map((dia) => (
                <div key={dia} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dia-${dia}`}
                    checked={(formData.dias_preferidos || []).includes(dia)}
                    onCheckedChange={() => toggleDia(dia)}
                  />
                  <Label htmlFor={`dia-${dia}`} className="font-normal cursor-pointer text-sm">
                    {dia}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Contato de Emergência</Label>
              <Input
                placeholder="Nome e telefone"
                value={formData.contato_emergencia}
                onChange={(e) => setFormData({ ...formData, contato_emergencia: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label>Indicação</Label>
              <Input
                placeholder="Quem indicou?"
                value={formData.indicacao}
                onChange={(e) => setFormData({ ...formData, indicacao: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Observações Adicionais</Label>
            <Textarea
              placeholder="Anotações gerais sobre o paciente..."
              className="min-h-[100px]"
              value={formData.observacoes_adicionais}
              onChange={(e) => setFormData({ ...formData, observacoes_adicionais: e.target.value })}
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Preferências
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
