import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { Card } from '@/components/system/Card'
import { Button } from '@/components/system/Button'
import { Select } from '@/components/system/Select'
import { Textarea } from '@/components/system/Textarea'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import {
  getEvolucoes,
  createEvolucao,
  getSessoes,
  getParticipantes,
  deleteEvolucao,
} from '@/services/grupos'

export function ProntuarioGrupo({ grupo }: { grupo: any }) {
  const { user } = useAuth()
  const [tab, setTab] = useState('coletiva')
  const [evolucoes, setEvolucoes] = useState<any[]>([])
  const [sessoes, setSessoes] = useState<any[]>([])
  const [participantes, setParticipantes] = useState<any[]>([])

  const [novaEvolucao, setNovaEvolucao] = useState({
    conteudo: '',
    sessao_id: '',
    participante_id: '',
  })
  const [filterPart, setFilterPart] = useState('')

  const loadData = async () => {
    try {
      const eList = await getEvolucoes(grupo.id, tab)
      if (tab === 'individual_em_grupo' && filterPart) {
        setEvolucoes(eList.filter((e) => e.participante_id === filterPart))
      } else {
        setEvolucoes(eList)
      }
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
    getSessoes(grupo.id).then(setSessoes)
    getParticipantes(grupo.id).then(setParticipantes)
  }, [grupo.id, tab, filterPart])

  const handleSave = async () => {
    if (!novaEvolucao.conteudo)
      return toast({ title: 'Preencha o conteúdo', variant: 'destructive' })
    if (tab === 'individual_em_grupo' && !novaEvolucao.participante_id)
      return toast({ title: 'Selecione o participante', variant: 'destructive' })

    try {
      await createEvolucao({
        grupo_id: grupo.id,
        tipo: tab,
        autor_id: user.id,
        sessao_id: novaEvolucao.sessao_id || null,
        participante_id: tab === 'individual_em_grupo' ? novaEvolucao.participante_id : null,
        conteudo: novaEvolucao.conteudo,
      })
      toast({ title: 'Evolução registrada' })
      setNovaEvolucao({ conteudo: '', sessao_id: '', participante_id: '' })
      loadData()
    } catch (e) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" /> Prontuário do Grupo
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Registre o andamento coletivo e individual de cada sessão.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="coletiva">Evolução Coletiva</TabsTrigger>
          <TabsTrigger value="individual_em_grupo">Evolução Individual</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 border-r pr-6 space-y-4">
            <h3 className="font-semibold text-gray-700">Nova Evolução</h3>

            {tab === 'individual_em_grupo' && (
              <Select
                label="Participante"
                value={novaEvolucao.participante_id}
                onChange={(e) =>
                  setNovaEvolucao({ ...novaEvolucao, participante_id: e.target.value })
                }
                options={[
                  { label: 'Selecione...', value: '' },
                  ...participantes.map((p) => ({
                    label: p.expand?.paciente_id?.name,
                    value: p.id,
                  })),
                ]}
              />
            )}

            <Select
              label="Sessão Relacionada (Opcional)"
              value={novaEvolucao.sessao_id}
              onChange={(e) => setNovaEvolucao({ ...novaEvolucao, sessao_id: e.target.value })}
              options={[
                { label: 'Geral', value: '' },
                ...sessoes.map((s) => ({
                  label: `${s.data.split('T')[0]} - ${s.tema || 'Sem tema'}`,
                  value: s.id,
                })),
              ]}
            />

            <Textarea
              label="Evolução Clínica"
              className="min-h-[200px]"
              value={novaEvolucao.conteudo}
              onChange={(e) => setNovaEvolucao({ ...novaEvolucao, conteudo: e.target.value })}
            />

            <Button className="w-full" onClick={handleSave}>
              Salvar Registro
            </Button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Histórico de Registros</h3>
              {tab === 'individual_em_grupo' && (
                <Select
                  value={filterPart}
                  onChange={(e) => setFilterPart(e.target.value)}
                  options={[
                    { label: 'Todos os Participantes', value: '' },
                    ...participantes.map((p) => ({
                      label: p.expand?.paciente_id?.name,
                      value: p.id,
                    })),
                  ]}
                  className="w-48"
                />
              )}
            </div>

            <div className="space-y-4 mt-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {evolucoes.map((ev) => (
                <Card key={ev.id} className="p-4 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs text-gray-500">
                        {new Date(ev.created).toLocaleString()}
                      </div>
                      {tab === 'individual_em_grupo' && (
                        <div className="font-medium text-sm text-primary mt-1">
                          Ref: {ev.expand?.participante_id?.expand?.paciente_id?.name}
                        </div>
                      )}
                      {ev.expand?.sessao_id && (
                        <div className="text-xs text-gray-500 mt-1">
                          Sessão: {ev.expand.sessao_id.data.split('T')[0]}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">Por: {ev.expand?.autor_id?.name}</div>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {ev.conteudo}
                  </p>
                </Card>
              ))}
              {evolucoes.length === 0 && (
                <p className="text-gray-500 py-4 text-center">Nenhum registro encontrado.</p>
              )}
            </div>
          </div>
        </div>
      </Tabs>
    </Card>
  )
}
