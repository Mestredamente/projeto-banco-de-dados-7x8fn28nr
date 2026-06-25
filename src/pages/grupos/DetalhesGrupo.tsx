import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getGrupo } from '@/services/grupos'
import { InformacoesGrupo } from '@/components/grupos/InformacoesGrupo'
import { ParticipantesGrupo } from '@/components/grupos/ParticipantesGrupo'
import { SessoesGrupo } from '@/components/grupos/SessoesGrupo'
import { ProntuarioGrupo } from '@/components/grupos/ProntuarioGrupo'
import { RelatoriosGrupo } from '@/components/grupos/RelatoriosGrupo'
import { Skeleton } from '@/components/system/Skeleton'

export default function DetalhesGrupo() {
  const { id } = useParams()
  const [grupo, setGrupo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      getGrupo(id)
        .then(setGrupo)
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading)
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  if (!grupo) return <div>Grupo não encontrado</div>

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Link to="/grupos" className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{grupo.nome}</h1>
          <p className="text-gray-500 text-sm capitalize">
            {grupo.tipo_grupo} • {grupo.modalidade}
          </p>
        </div>
      </div>

      <Tabs defaultValue="informacoes" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="participantes">Participantes</TabsTrigger>
          <TabsTrigger value="sessoes">Sessões</TabsTrigger>
          <TabsTrigger value="prontuario">Prontuário</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="informacoes">
            <InformacoesGrupo grupo={grupo} />
          </TabsContent>
          <TabsContent value="participantes">
            <ParticipantesGrupo grupo={grupo} onUpdate={() => getGrupo(id!).then(setGrupo)} />
          </TabsContent>
          <TabsContent value="sessoes">
            <SessoesGrupo grupo={grupo} />
          </TabsContent>
          <TabsContent value="prontuario">
            <ProntuarioGrupo grupo={grupo} />
          </TabsContent>
          <TabsContent value="relatorios">
            <RelatoriosGrupo grupo={grupo} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
