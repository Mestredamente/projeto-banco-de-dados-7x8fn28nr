import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, User, ShieldCheck, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default function PatientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    date_of_birth: '',
    notes: '',
    research_consent: false,
    portal_permissions: {
      diary: true,
      financial: true,
      evolutions: true,
      life_protection_consent: false,
      custom_triggers: '',
    },
  })

  useEffect(() => {
    if (id) {
      pb.collection('patients')
        .getOne(id)
        .then((record) => {
          setFormData({
            name: record.name || '',
            email: record.email || '',
            phone: record.phone || '',
            cpf: record.cpf || '',
            date_of_birth: record.date_of_birth ? record.date_of_birth.substring(0, 10) : '',
            notes: record.notes || '',
            research_consent: record.research_consent || false,
            portal_permissions: {
              diary: true,
              financial: true,
              evolutions: true,
              life_protection_consent: false,
              custom_triggers: '',
              ...(record.portal_permissions || {}),
            },
          })
        })
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.portal_permissions.diary && !formData.portal_permissions.life_protection_consent) {
      toast({
        title: 'Erro de Consentimento',
        description:
          'Para habilitar o Diário de Sentimentos, o consentimento de Proteção à Vida (LGPD/CFP) é obrigatório.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const dataToSave = {
        ...formData,
        date_of_birth: formData.date_of_birth
          ? new Date(formData.date_of_birth).toISOString()
          : null,
      }

      if (id) {
        await pb.collection('patients').update(id, dataToSave)
        toast({ title: 'Paciente atualizado com sucesso' })
      } else {
        dataToSave.created_by = user.id
        await pb.collection('patients').create(dataToSave)
        toast({ title: 'Paciente criado com sucesso' })
      }
      navigate('/patients')
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in-up">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Editar Paciente' : 'Novo Paciente'}
          </h1>
          <p className="text-gray-500 text-sm">
            Preencha os dados do paciente e configure o portal.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-teal-600" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome Completo</Label>
                <Input
                  required
                  placeholder="Ex: Maria Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  placeholder="Ex: maria@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Observações Clínicas (Uso Interno)</Label>
                <Textarea
                  rows={4}
                  placeholder="Informações relevantes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-teal-500">
          <CardHeader className="bg-teal-50/30 border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-teal-800">
              <ShieldCheck className="h-5 w-5" />
              Configurações de Visibilidade do Portal
            </CardTitle>
            <CardDescription>
              Controle quais abas e informações o paciente poderá acessar pelo seu portal exclusivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="space-y-1">
                <Label className="text-base text-gray-900">Diário de Sentimentos</Label>
                <p className="text-sm text-gray-500">
                  Permite que o paciente acesse a escala de humor e preencha o diário.
                </p>
              </div>
              <Switch
                checked={formData.portal_permissions.diary}
                onCheckedChange={(v) =>
                  setFormData({
                    ...formData,
                    portal_permissions: { ...formData.portal_permissions, diary: v },
                  })
                }
              />
            </div>

            {formData.portal_permissions.diary && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-100 space-y-4 animate-fade-in-down">
                <div className="space-y-2">
                  <Label className="text-sm text-red-900">
                    Palavras-Gatilho Personalizadas (opcional)
                  </Label>
                  <Input
                    className="border-red-200 bg-white"
                    placeholder="Ex: remédio, pular, ponte (separadas por vírgula)"
                    value={formData.portal_permissions.custom_triggers || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        portal_permissions: {
                          ...formData.portal_permissions,
                          custom_triggers: e.target.value,
                        },
                      })
                    }
                  />
                  <p className="text-[10px] text-red-700">
                    Estas palavras gerarão um alerta imediato caso o paciente as utilize no diário,
                    além das palavras padrão do sistema.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="space-y-1">
                <Label className="text-base text-gray-900">Financeiro e Recibos</Label>
                <p className="text-sm text-gray-500">
                  Permite visualizar histórico de cobranças e baixar recibos gerados.
                </p>
              </div>
              <Switch
                checked={formData.portal_permissions.financial}
                onCheckedChange={(v) =>
                  setFormData({
                    ...formData,
                    portal_permissions: { ...formData.portal_permissions, financial: v },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="space-y-1">
                <Label className="text-base text-gray-900">Evoluções Compartilhadas</Label>
                <p className="text-sm text-gray-500">
                  Permite visualizar os resumos e tarefas que você optar por compartilhar na sessão.
                </p>
              </div>
              <Switch
                checked={formData.portal_permissions.evolutions}
                onCheckedChange={(v) =>
                  setFormData({
                    ...formData,
                    portal_permissions: { ...formData.portal_permissions, evolutions: v },
                  })
                }
              />
            </div>

            <div className="space-y-4 p-6 bg-slate-50 rounded-lg border border-slate-200 mt-6">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
                Gestão de Consentimentos (LGPD)
              </h3>

              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  required
                  checked={!!(formData as any).consent_clinical_at}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      consent_clinical_at: e.target.checked ? new Date().toISOString() : null,
                      consent_form_signed: e.target.checked,
                    } as any)
                  }
                />
                <div className="space-y-1 leading-snug">
                  <span className="text-sm font-medium text-slate-900 group-hover:text-teal-700 transition-colors">
                    Autorizo o armazenamento e tratamento dos meus dados para fins de atendimento
                    clínico, conforme a LGPD.
                  </span>
                  <p className="text-xs text-red-500 font-medium">* Obrigatório</p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  checked={!!(formData as any).consent_risk_at}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      consent_risk_at: e.target.checked ? new Date().toISOString() : null,
                      portal_permissions: {
                        ...formData.portal_permissions,
                        life_protection_consent: e.target.checked,
                      },
                    } as any)
                  }
                />
                <div className="space-y-1 leading-snug">
                  <span className="text-sm font-medium text-slate-900 group-hover:text-teal-700 transition-colors">
                    Autorizo a quebra de sigilo em caso de risco iminente à minha vida ou de
                    terceiros, conforme previsto no Código de Ética do Psicólogo e na LGPD.
                  </span>
                  <p className="text-xs text-slate-500">
                    * Obrigatório para uso do Diário de Sentimentos
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  checked={!!(formData as any).consent_research_at}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      consent_research_at: e.target.checked ? new Date().toISOString() : null,
                      research_consent: e.target.checked,
                    } as any)
                  }
                />
                <div className="space-y-1 leading-snug">
                  <span className="text-sm font-medium text-slate-900 group-hover:text-teal-700 transition-colors">
                    Autorizo o uso anonimizado dos meus dados para fins de pesquisa científica.
                  </span>
                  <p className="text-xs text-slate-500">(Opcional)</p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  checked={!!(formData as any).consent_referral_at}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      consent_referral_at: e.target.checked ? new Date().toISOString() : null,
                    } as any)
                  }
                />
                <div className="space-y-1 leading-snug w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 group-hover:text-teal-700 transition-colors">
                      Autorizo o compartilhamento dos meus dados anonimizados (idade, queixa
                      principal, especialidade) com outros psicólogos para fins de encaminhamento
                      clínico.
                    </span>
                    <Tooltip>
                      <TooltipTrigger type="button" className="cursor-help">
                        <Info className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Isso permite que seu psicólogo compartilhe informações básicas do seu caso
                        com outro profissional, caso necessário.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-slate-500">(Opcional)</p>
                </div>
              </label>
            </div>

            <div className="hidden">
              <div className="space-y-1">
                <Label className="text-base text-blue-900">Consentimento para Pesquisa (P&D)</Label>
                <p className="text-sm text-blue-700">
                  Autoriza o uso de dados de forma estritamente anonimizada para fins de produção
                  científica e estatística, independente do termo clínico geral.
                </p>
              </div>
              <Switch
                checked={formData.research_consent}
                onCheckedChange={(v) => setFormData({ ...formData, research_consent: v })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 px-8 text-white"
          >
            {loading ? 'Salvando...' : 'Salvar Paciente'}
          </Button>
        </div>
      </form>
    </div>
  )
}
