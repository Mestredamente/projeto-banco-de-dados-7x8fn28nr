import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { toast } from '@/hooks/use-toast'
import { Info } from 'lucide-react'

export function PatientProfileCompletionBanner({
  patientId,
  onComplete,
}: {
  patientId: string
  onComplete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    address_cep: '',
    address_street: '',
    address_number: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    health_insurance: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  })
  const [loading, setLoading] = useState(false)

  const handleCEP = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let cep = e.target.value.replace(/\D/g, '')
    setForm((p) => ({ ...p, address_cep: cep }))
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setForm((p) => ({
            ...p,
            address_street: data.logradouro || '',
            address_neighborhood: data.bairro || '',
            address_city: data.localidade || '',
            address_state: data.uf || '',
          }))
        }
      } catch {
        /* intentionally ignored */
      }
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await pb.collection('patients').update(patientId, {
        ...form,
        cadastro_completo: true,
      })
      toast({ title: 'Sucesso', description: 'Cadastro completado com sucesso.' })
      setOpen(false)
      onComplete()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os dados.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="p-4 mb-6 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-amber-500" />
          <div>
            <h4 className="font-semibold text-amber-900">Complete seu cadastro</h4>
            <p className="text-sm text-amber-800">
              Seu perfil ainda está incompleto. Precisamos de algumas informações adicionais para o
              seu prontuário.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          Completar Agora
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Completar Cadastro</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <h4 className="font-medium text-sm text-gray-500 uppercase">Endereço</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input value={form.address_cep} onChange={handleCEP} maxLength={8} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Rua / Logradouro</Label>
                <Input
                  value={form.address_street}
                  onChange={(e) => setForm((p) => ({ ...p, address_street: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2 col-span-1">
                <Label>Número</Label>
                <Input
                  value={form.address_number}
                  onChange={(e) => setForm((p) => ({ ...p, address_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2 col-span-3">
                <Label>Bairro</Label>
                <Input
                  value={form.address_neighborhood}
                  onChange={(e) => setForm((p) => ({ ...p, address_neighborhood: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Cidade</Label>
                <Input
                  value={form.address_city}
                  onChange={(e) => setForm((p) => ({ ...p, address_city: e.target.value }))}
                />
              </div>
              <div className="space-y-2 col-span-1">
                <Label>Estado (UF)</Label>
                <Input
                  value={form.address_state}
                  onChange={(e) => setForm((p) => ({ ...p, address_state: e.target.value }))}
                />
              </div>
            </div>

            <h4 className="font-medium text-sm text-gray-500 uppercase mt-6">
              Informações Adicionais
            </h4>
            <div className="space-y-2">
              <Label>Convênio Médico (se houver)</Label>
              <Input
                value={form.health_insurance}
                onChange={(e) => setForm((p) => ({ ...p, health_insurance: e.target.value }))}
                placeholder="Ex: Bradesco Saúde, Amil..."
              />
            </div>

            <h4 className="font-medium text-sm text-gray-500 uppercase mt-6">
              Contato de Emergência
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Contato</Label>
                <Input
                  value={form.emergency_contact_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, emergency_contact_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone do Contato</Label>
                <Input
                  value={form.emergency_contact_phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, emergency_contact_phone: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground"
              >
                {loading ? 'Salvando...' : 'Salvar Dados'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
