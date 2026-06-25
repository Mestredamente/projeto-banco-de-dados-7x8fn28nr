import { Card } from '@/components/system/Card'
import { Button } from '@/components/system/Button'
import { Link } from 'react-router-dom'
import { Edit } from 'lucide-react'

export function InformacoesGrupo({ grupo }: { grupo: any }) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-6 border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold">Perfil do Grupo</h2>
          <p className="text-gray-500 text-sm mt-1">{grupo.descricao || 'Sem descrição'}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/grupos/${grupo.id}/editar`}>
            <Edit className="w-4 h-4 mr-2" /> Editar
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">Psicólogo Responsável</div>
            <div className="font-medium">{grupo.expand?.psicologo_responsavel?.name || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div className="font-medium capitalize">{grupo.status}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Público Alvo</div>
            <div className="font-medium">{grupo.publico_alvo || '-'}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">Recorrência</div>
            <div className="font-medium capitalize">
              {grupo.recorrencia} ({grupo.dia_semana})
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Horário</div>
            <div className="font-medium">
              {grupo.horario} ({grupo.duracao_minutos} min)
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Sala / Link</div>
            <div className="font-medium">{grupo.sala || '-'}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">Vagas Totais</div>
            <div className="font-medium">{grupo.vagas_total}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Vagas Disponíveis</div>
            <div className="font-medium">{grupo.vagas_disponiveis}</div>
          </div>
          {grupo.modalidade === 'fechado' && (
            <div>
              <div className="text-sm text-gray-500">Período</div>
              <div className="font-medium">
                {grupo.data_inicio?.split('T')[0]} até {grupo.data_fim?.split('T')[0]}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
