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
import { ArrowLeft, User, ShieldCheck } from 'lucide-react'

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
                <div className="flex items-start space-x-3">
                  <Switch
                    checked={formData.portal_permissions.life_protection_consent}
                    onCheckedChange={(v) =>
                      setFormData({
                        ...formData,
                        portal_permissions: {
                          ...formData.portal_permissions,
                          life_protection_consent: v,
                        },
                      })
                    }
                  />
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-red-900">
                      Termo de Proteção à Vida (Obrigatório)
                    </Label>
                    <p className="text-xs text-red-700 leading-relaxed">
                      "Autorizo a quebra de sigilo em caso de risco iminente à minha vida ou de
                      terceiros, conforme previsto no Código de Ética do Psicólogo e na LGPD."
                    </p>
                  </div>
                </div>
                <div className="space-y-2 pl-12">
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
