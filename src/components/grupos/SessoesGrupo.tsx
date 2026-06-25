import { useEffect, useState } from 'react'
import { Calendar, CheckCircle } from 'lucide-react'
import { Card } from '@/components/system/Card'
import { Button } from '@/components/system/Button'
import { Badge } from '@/components/system/Badge'
import { Modal } from '@/components/system/Modal'
import { Input } from '@/components/system/Input'
import { Select } from '@/components/system/Select'
import { Checkbox } from '@/components/system/Checkbox'
import { Textarea } from '@/components/system/Textarea'
import { toast } from '@/components/ui/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getSessoes,
  createSessao,
  getPresencas,
  updatePresenca,
  updateSessao,
} from '@/services/grupos'

export function SessoesGrupo({ grupo }: { grupo: any }) {
  const [sessoes, setSessoes] = useState<any[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [presencaSessao, setPresencaSessao] = useState<any>(null)
  const [presencas, setPresencas] = useState<any[]>([])

  const [novaSessao, setNovaSessao] = useState({
    data: '',
    horario_inicio: grupo.horario,
    horario_fim: '',
    tema: '',
    modalidade: 'presencial',
  })

  const load = async () => {
    const list = await getSessoes(grupo.id)
    setSessoes(list)
  }
  useEffect(() => {
    load()
  }, [grupo.id])

  const handleAdd = async () => {
    try {
      await createSessao({
        grupo_id: grupo.id,
        status: 'agendada',
        ...novaSessao,
        data: novaSessao.data + 'T12:00:00.000Z',
      })
      toast({ title: 'Sessão agendada!' })
      setIsAddOpen(false)
      load()
    } catch (e) {
      toast({ title: 'Erro ao criar', variant: 'destructive' })
    }
  }

  const openPresenca = async (sessao: any) => {
    setPresencaSessao(sessao)
    const plist = await getPresencas(sessao.id)
    setPresencas(plist)
  }

  const handlePresencaChange = (id: string, field: string, val: any) => {
    setPresencas((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: val } : p)))
  }

  const savePresencas = async () => {
    try {
      await Promise.all(
        presencas.map((p) =>
          updatePresenca(p.id, { presente: p.presente, justificativa: p.justificativa }),
        ),
      )
      await updateSessao(presencaSessao.id, { status: 'realizada' })
      toast({ title: 'Presenças e status atualizados!' })
      setPresencaSessao(null)
      load()
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" /> Sessões Agendadas
        </h2>
        <Button onClick={() => setIsAddOpen(true)}>Nova Sessão</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tema</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessoes.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.data.split('T')[0]}</TableCell>
              <TableCell>{s.tema || '-'}</TableCell>
              <TableCell>{s.horario_inicio}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    s.status === 'realizada'
                      ? 'success'
                      : s.status === 'cancelada'
                        ? 'destructive'
                        : 'default'
                  }
                >
                  {s.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => openPresenca(s)}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Presenças
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {sessoes.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                Nenhuma sessão encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal open={isAddOpen} onOpenChange={setIsAddOpen} title="Agendar Sessão">
        <div className="space-y-4">
          <Input
            type="date"
            label="Data"
            value={novaSessao.data}
            onChange={(e) => setNovaSessao({ ...novaSessao, data: e.target.value })}
          />
          <Input
            label="Tema / Assunto"
            value={novaSessao.tema}
            onChange={(e) => setNovaSessao({ ...novaSessao, tema: e.target.value })}
          />
          <div className="flex gap-4">
            <Input
              type="time"
              label="Início"
              value={novaSessao.horario_inicio}
              onChange={(e) => setNovaSessao({ ...novaSessao, horario_inicio: e.target.value })}
            />
            <Input
              type="time"
              label="Fim"
              value={novaSessao.horario_fim}
              onChange={(e) => setNovaSessao({ ...novaSessao, horario_fim: e.target.value })}
            />
          </div>
          <Select
            label="Modalidade"
            value={novaSessao.modalidade}
            onChange={(e) => setNovaSessao({ ...novaSessao, modalidade: e.target.value })}
            options={[
              { label: 'Presencial', value: 'presencial' },
              { label: 'Online', value: 'online' },
            ]}
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
        open={!!presencaSessao}
        onOpenChange={(v) => !v && setPresencaSessao(null)}
        title="Registrar Presença"
        description={`Sessão do dia ${presencaSessao?.data?.split('T')[0]}`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {presencas.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum participante na lista.</p>
          ) : null}
          {presencas.map((p) => (
            <div key={p.id} className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3 mb-2">
                <Checkbox
                  checked={p.presente}
                  onCheckedChange={(c) => handlePresencaChange(p.id, 'presente', !!c)}
                  id={`chk-${p.id}`}
                />
                <label htmlFor={`chk-${p.id}`} className="font-medium cursor-pointer">
                  {p.expand?.participante_id?.expand?.paciente_id?.name}
                </label>
              </div>
              {!p.presente && (
                <Textarea
                  placeholder="Justificativa da falta (opcional)"
                  value={p.justificativa}
                  onChange={(e) => handlePresencaChange(p.id, 'justificativa', e.target.value)}
                  className="mt-2 text-sm"
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPresencaSessao(null)}>
              Fechar
            </Button>
            <Button onClick={savePresencas}>Salvar e Concluir Sessão</Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
