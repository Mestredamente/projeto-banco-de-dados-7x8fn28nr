import { useEffect, useState } from 'react'
import { BarChart2 } from 'lucide-react'
import { Card } from '@/components/system/Card'
import { getSessoes, getParticipantes, getPresencas } from '@/services/grupos'

export function RelatoriosGrupo({ grupo }: { grupo: any }) {
  const [stats, setStats] = useState({
    sessoesTotal: 0,
    sessoesRealizadas: 0,
    participantesAtivos: 0,
    mediaPresenca: 0,
  })

  useEffect(() => {
    async function load() {
      const parts = await getParticipantes(grupo.id)
      const sess = await getSessoes(grupo.id)

      const partsAtivos = parts.filter((p) => p.status === 'ativo').length
      const realizadas = sess.filter((s) => s.status === 'realizada')

      let presencas = 0
      let totalPresencas = 0
      for (const s of realizadas) {
        const pList = await getPresencas(s.id)
        for (const p of pList) {
          totalPresencas++
          if (p.presente) presencas++
        }
      }

      setStats({
        sessoesTotal: sess.length,
        sessoesRealizadas: realizadas.length,
        participantesAtivos: partsAtivos,
        mediaPresenca: totalPresencas > 0 ? Math.round((presencas / totalPresencas) * 100) : 0,
      })
    }
    load()
  }, [grupo.id])

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-gray-500" /> Relatórios Analíticos
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-1">Participantes Ativos</div>
          <div className="text-2xl font-bold">{stats.participantesAtivos}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-1">Sessões Realizadas</div>
          <div className="text-2xl font-bold">
            {stats.sessoesRealizadas} / {stats.sessoesTotal}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-1">Adesão / Presença Média</div>
          <div className="text-2xl font-bold">{stats.mediaPresenca}%</div>
        </Card>
      </div>

      <Card className="p-6">
        <p className="text-gray-500 text-sm">
          Mais relatórios visuais serão adicionados nesta seção em breve.
        </p>
      </Card>
    </div>
  )
}
