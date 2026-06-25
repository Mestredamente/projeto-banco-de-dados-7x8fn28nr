import { useEffect, useState } from 'react'
import { Users, UserPlus } from 'lucide-react'
import { Card } from '@/components/system/Card'
import { Button } from '@/components/system/Button'
import { Badge } from '@/components/system/Badge'
import { Modal } from '@/components/system/Modal'
import { Select } from '@/components/system/Select'
import { Input } from '@/components/system/Input'
import { toast } from '@/components/ui/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import pb from '@/lib/pocketbase/client'
import {
  getParticipantes,
  addParticipante,
  updateParticipante,
  updateGrupo,
} from '@/services/grupos'

export function ParticipantesGrupo({ grupo, onUpdate }: { grupo: any; onUpdate: () => void }) {
  const [participantes, setParticipantes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [patients, setPatients] = useState<any[]>([])

  const [newPatient, setNewPatient] = useState('')
  const [dataEntrada, setDataEntrada] = useState(new Date().toISOString().split('T')[0])

  const [dismissModal, setDismissModal] = useState<any>(null)
  const [motivo, setMotivo] = useState('')

  const load = async () => {
    setLoading(true)
    const pts = await getParticipantes(grupo.id)
    setParticipantes(pts)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [grupo.id])

  const openAddModal = async () => {
    const list = await pb
      .collection('patients')
      .getFullList({ filter: "deleted_at = '' && is_active = true", sort: 'name' })
    const unassigned = list.filter(
      (p) => !participantes.find((part) => part.paciente_id === p.id && part.status === 'ativo'),
    )
    setPatients(unassigned)
    setIsAddOpen(true)
  }

  const handleAdd = async () => {
    if (!newPatient) return
    if (grupo.vagas_disponiveis <= 0) {
      toast({ title: 'Aviso', description: 'Não há vagas disponíveis.', variant: 'destructive' })
      return
    }
    try {
      await addParticipante({
        grupo_id: grupo.id,
        paciente_id: newPatient,
        status: 'ativo',
        data_entrada: dataEntrada + 'T12:00:00.000Z',
      })
      await updateGrupo(grupo.id, { vagas_disponiveis: grupo.vagas_disponiveis - 1 })
      toast({ title: 'Sucesso', description: 'Participante adicionado.' })
      setIsAddOpen(false)
      setNewPatient('')
      load()
      onUpdate()
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao adicionar.', variant: 'destructive' })
    }
  }

  const handleDismiss = async () => {
    try {
      await updateParticipante(dismissModal.id, {
        status: 'desligado',
        data_saida: new Date().toISOString(),
        motivo_desligamento: motivo,
      })
      await updateGrupo(grupo.id, { vagas_disponiveis: grupo.vagas_disponiveis + 1 })
      toast({ title: 'Sucesso', description: 'Participante desligado.' })
      setDismissModal(null)
      setMotivo('')
      load()
      onUpdate()
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao desligar.', variant: 'destructive' })
    }
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500" /> Participantes
        </h2>
        <Button onClick={openAddModal} disabled={grupo.vagas_disponiveis <= 0}>
          <UserPlus className="w-4 h-4 mr-2" /> Adicionar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Data de Entrada</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participantes.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.expand?.paciente_id?.name}</TableCell>
              <TableCell>{p.data_entrada?.split('T')[0]}</TableCell>
              <TableCell>
                <Badge variant={p.status === 'ativo' ? 'success' : 'secondary'}>{p.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {p.status === 'ativo' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => setDismissModal(p)}
                  >
                    Desligar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {participantes.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                Nenhum participante no grupo.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Adicionar Participante"
        description="Vincule um paciente existente ao grupo."
      >
        <div className="space-y-4">
          <Select
            label="Paciente"
            value={newPatient}
            onChange={(e) => setNewPatient(e.target.value)}
            options={[
              { label: 'Selecione', value: '' },
              ...patients.map((p) => ({ label: p.name, value: p.id })),
            ]}
          />
          <Input
            type="date"
            label="Data de Entrada"
            value={dataEntrada}
            onChange={(e) => setDataEntrada(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd}>Confirmar</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!dismissModal}
        onOpenChange={(v) => !v && setDismissModal(null)}
        title="Desligar Participante"
      >
        <div className="space-y-4">
          <Input
            label="Motivo do Desligamento"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDismissModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleDismiss} className="bg-red-600 hover:bg-red-700">
              Desligar
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
