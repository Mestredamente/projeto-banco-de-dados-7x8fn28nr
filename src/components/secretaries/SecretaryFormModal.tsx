import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SecretaryFormModal({ assignment, open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState(assignment?.expand?.secretary?.name || '')
  const [email, setEmail] = useState(assignment?.expand?.secretary?.email || '')
  const [cpf, setCpf] = useState(assignment?.expand?.secretary?.cpf || '')
  const [phone, setPhone] = useState(assignment?.expand?.secretary?.phone || '')

  const hr = assignment?.permissions?.hr || {}
  const [contractType, setContractType] = useState(hr.contract_type || 'CLT')
  const [pis, setPis] = useState(hr.pis || '')
  const [hireDate, setHireDate] = useState(hr.hire_date || '')

  const [commType, setCommType] = useState(hr.commission_type || 'none')
  const [commValue, setCommValue] = useState(hr.commission_value || 0)

  const perms = assignment?.permissions?.rbac || {
    agenda: true,
    pacientes: true,
    financeiro: false,
    relatorios: false,
    notificacoes: true,
    prontuario: false,
    configuracoes: false,
  }
  const [rbac, setRbac] = useState(perms)

  const handleSave = async () => {
    if (!name || !email) return toast.error('Nome e email são obrigatórios.')
    setLoading(true)
    try {
      let secId = assignment?.secretary
      if (!secId) {
        const tempPass = Math.random().toString(36).slice(-8) + 'S!1a'
        const newUser = await pb.collection('users').create({
          email,
          password: tempPass,
          passwordConfirm: tempPass,
          name,
          cpf,
          phone,
          role: 'secretaria',
          is_active: true,
        })
        secId = newUser.id
        await pb.collection('users').requestPasswordReset(email)
      } else {
        await pb.collection('users').update(secId, { name, cpf, phone })
      }

      const payload = {
        secretary: secId,
        employer: pb.authStore.record?.id,
        is_active: true,
        permissions: {
          hr: {
            contract_type: contractType,
            pis,
            hire_date: hireDate,
            commission_type: commType,
            commission_value: Number(commValue),
          },
          rbac,
        },
      }

      if (assignment?.id) {
        await pb.collection('secretary_assignments').update(assignment.id, payload)
        toast.success('Atualizado com sucesso!')
      } else {
        await pb.collection('secretary_assignments').create(payload)
        toast.success('Secretária cadastrada com sucesso! Um email foi enviado a ela.')
      }

      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
      toast.error('Erro ao salvar. Verifique se o email já está em uso.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{assignment ? 'Editar Secretária' : 'Nova Secretária'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados">
          <TabsList className="w-full">
            <TabsTrigger value="dados" className="flex-1">
              Dados e RH
            </TabsTrigger>
            <TabsTrigger value="permissoes" className="flex-1">
              Permissões (RBAC)
            </TabsTrigger>
            <TabsTrigger value="comissionamento" className="flex-1">
              Comissão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email (Login)</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!assignment}
                />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={cpf} onChange={(e) => setCpf(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Contrato</Label>
                <Select value={contractType} onValueChange={setContractType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLT">CLT</SelectItem>
                    <SelectItem value="PJ">PJ</SelectItem>
                    <SelectItem value="Estágio">Estágio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>PIS</Label>
                <Input value={pis} onChange={(e) => setPis(e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Data de Admissão</Label>
                <Input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissoes" className="pt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Defina as áreas do sistema que esta secretária pode acessar.
              </p>

              <div className="grid gap-3">
                {Object.keys(rbac).map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                  >
                    <div>
                      <h4 className="font-medium capitalize">{key}</h4>
                      <p className="text-xs text-muted-foreground">
                        {key === 'agenda' && 'Visualizar, criar, editar e excluir sessões.'}
                        {key === 'pacientes' &&
                          'Acesso apenas a dados cadastrais. Não inclui prontuário.'}
                        {key === 'financeiro' &&
                          'Registrar recebimentos. Sem permissão de exclusão/estorno.'}
                        {key === 'relatorios' && 'Apenas relatórios de produção.'}
                        {key === 'notificacoes' && 'Disparar lembretes manuais.'}
                        {key === 'prontuario' && 'Acesso restrito ao prontuário clínico. Cuidado!'}
                        {key === 'configuracoes' && 'Acesso às configurações da clínica.'}
                      </p>
                    </div>
                    <Switch
                      checked={rbac[key]}
                      onCheckedChange={(c) => setRbac({ ...rbac, [key]: c })}
                      disabled={key === 'prontuario' || key === 'configuracoes'}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comissionamento" className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Regra de Comissionamento</Label>
              <Select value={commType} onValueChange={setCommType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem comissão</SelectItem>
                  <SelectItem value="percent_session">% por Sessão</SelectItem>
                  <SelectItem value="fixed_session">Valor Fixo por Sessão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {commType !== 'none' && (
              <div className="space-y-2">
                <Label>Valor / Percentual</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={commValue}
                  onChange={(e) => setCommValue(Number(e.target.value))}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {loading ? 'Salvando...' : 'Salvar Secretária'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
