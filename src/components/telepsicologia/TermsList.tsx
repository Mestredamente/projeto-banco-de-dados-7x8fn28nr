import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Link, Plus, FileSignature } from 'lucide-react'
import { EmptyState } from '@/components/system/EmptyState'

export function TermsList() {
  const [terms, setTerms] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [content, setContent] = useState(
    'TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO PARA ATENDIMENTO PSICOLÓGICO ONLINE (Resolução CFP nº 4/2020)\n\nEu, abaixo identificado(a), consinto de forma livre e esclarecida a minha participação nos atendimentos psicológicos na modalidade online...',
  )

  const loadData = async () => {
    try {
      const [termsRes, patRes] = await Promise.all([
        pb.collection('termos_telepsicologia').getFullList({ expand: 'patient', sort: '-created' }),
        pb.collection('patients').getFullList({ filter: 'is_active = true', sort: 'name' }),
      ])
      setTerms(termsRes)
      setPatients(patRes)
    } catch {
      /* intentionally ignored */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async () => {
    if (!patientId) return toast.error('Selecione um paciente')
    try {
      await pb.collection('termos_telepsicologia').create({
        patient: patientId,
        professional: pb.authStore.record!.id,
        term_content: content,
        status: 'Pendente',
      })
      toast.success('Termo gerado!')
      setCreateModal(false)
      loadData()
    } catch (e) {
      toast.error('Erro ao gerar termo')
    }
  }

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/patient-portal/consents`)
    toast.success('Link do portal do paciente copiado para a área de transferência!')
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Consentimentos Regulatórios (CFP)</h3>
        <Button onClick={() => setCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Novo Termo
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Paciente</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Data de Aceite</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {terms.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-4 py-12">
                  <EmptyState
                    icon={FileSignature}
                    title="Nenhum termo gerado"
                    description="Gere um termo para os pacientes de telepsicologia."
                  />
                </td>
              </tr>
            )}
            {terms.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{t.expand?.patient?.name}</td>
                <td className="px-4 py-3">
                  {t.status === 'Aceito' ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Aceito
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pendente
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {t.accepted_at ? format(new Date(t.accepted_at), 'dd/MM/yyyy HH:mm') : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => copyLink(t.id)}>
                    <Link className="w-4 h-4 mr-1" /> Enviar para Paciente
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerar Termo de Telepsicologia</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conteúdo do Termo</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Gerar Termo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
