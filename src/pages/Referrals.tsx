import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'

export default function Referrals() {
  const { user } = useAuth()
  const [received, setReceived] = useState<any[]>([])
  const [sent, setSent] = useState<any[]>([])

  const loadReferrals = async () => {
    try {
      const res = await pb.collection('referrals').getFullList({
        sort: '-created',
        expand: 'patient,source,destination',
      })
      setReceived(res.filter((r) => r.destination === user?.id))
      setSent(res.filter((r) => r.source === user?.id))
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadReferrals()
  }, [user?.id])
  useRealtime('referrals', loadReferrals)

  const updateStatus = async (id: string, status: string) => {
    try {
      await pb.collection('referrals').update(id, { status })
      toast({ title: 'Status atualizado com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Encaminhamentos</h1>
        <p className="text-gray-500 mt-1">Gerencie encaminhamentos clínicos de forma segura.</p>
      </div>

      <Tabs defaultValue="recebidos" className="w-full">
        <TabsList>
          <TabsTrigger value="recebidos">Recebidos ({received.length})</TabsTrigger>
          <TabsTrigger value="enviados">Enviados ({sent.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="recebidos" className="mt-6 space-y-4">
          {received.length === 0 ? (
            <p className="text-gray-500">Você não tem encaminhamentos recebidos.</p>
          ) : (
            received.map((ref) => (
              <Card key={ref.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{ref.specialty}</h3>
                      <p className="text-sm text-gray-500">
                        Enviado por: {ref.expand?.source?.name} em{' '}
                        {new Date(ref.created).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant="outline">{ref.status}</Badge>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md mb-4 text-sm text-gray-700">
                    <span className="font-medium block mb-1">Resumo (Anonimizado):</span>
                    {ref.justification}
                  </div>

                  {ref.status === 'Enviado' && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => updateStatus(ref.id, 'Aceito')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Aceitar Caso
                      </Button>
                      <Button
                        onClick={() => updateStatus(ref.id, 'Recusado')}
                        variant="destructive"
                      >
                        Recusar
                      </Button>
                    </div>
                  )}
                  {ref.status === 'Aceito' && (
                    <Button onClick={() => updateStatus(ref.id, '1ª Sessão')} variant="secondary">
                      Marcar 1ª Sessão Realizada
                    </Button>
                  )}
                  {ref.status === '1ª Sessão' && (
                    <Button onClick={() => updateStatus(ref.id, 'Finalizado')} variant="outline">
                      Finalizar Acompanhamento
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="enviados" className="mt-6 space-y-4">
          {sent.length === 0 ? (
            <p className="text-gray-500">Você não enviou nenhum encaminhamento.</p>
          ) : (
            sent.map((ref) => (
              <Card key={ref.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Para: {ref.expand?.destination?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Paciente: {ref.expand?.patient?.name} (Token: {ref.token})
                      </p>
                    </div>
                    <Badge variant="outline">{ref.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-700">{ref.justification}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
