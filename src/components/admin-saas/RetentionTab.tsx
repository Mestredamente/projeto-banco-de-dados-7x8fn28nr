import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { Mail, RefreshCw } from 'lucide-react'

export function RetentionTab() {
  const [cancels, setCancels] = useState<any[]>([])

  async function load() {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const data = await pb.collection('subscriptions').getFullList({
        filter: `status = 'canceled' && canceled_at >= '${thirtyDaysAgo.toISOString()}'`,
        expand: 'subscriber,plan',
        sort: '-canceled_at',
      })
      setCancels(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const sendOffer = async (subId: string) => {
    try {
      await pb.collection('subscriptions').update(subId, {
        retention_offer_sent_at: new Date().toISOString(),
        retention_offer_status: 'pendente',
      })
      toast.success('Oferta de retenção enviada por e-mail com sucesso.')
      load()
    } catch (err) {
      toast.error('Erro ao enviar oferta')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Centro de Cancelamentos e Retenção</h2>
        <p className="text-sm text-muted-foreground">Cancelamentos nos últimos 30 dias</p>
      </div>

      <div className="border rounded-md bg-white dark:bg-gray-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assinante</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Plano Anterior</TableHead>
              <TableHead>Data Cancelamento</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Status Oferta</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cancels.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">
                  {sub.expand?.subscriber?.name || 'N/A'}
                </TableCell>
                <TableCell>{sub.expand?.subscriber?.email || 'N/A'}</TableCell>
                <TableCell>{sub.expand?.plan?.name || 'N/A'}</TableCell>
                <TableCell>{new Date(sub.canceled_at).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{sub.cancellation_reason || 'Não informado'}</TableCell>
                <TableCell>
                  {sub.retention_offer_status === 'pendente' ? (
                    <span className="text-yellow-600 text-xs font-medium">Aguardando Resposta</span>
                  ) : sub.retention_offer_status === 'aceita' ? (
                    <span className="text-green-600 text-xs font-medium">Oferta Aceita</span>
                  ) : sub.retention_offer_status === 'recusada' ? (
                    <span className="text-red-600 text-xs font-medium">Oferta Recusada</span>
                  ) : (
                    <span className="text-gray-500 text-xs font-medium">Não enviada</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendOffer(sub.id)}
                    disabled={!!sub.retention_offer_sent_at}
                  >
                    {sub.retention_offer_sent_at ? (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    {sub.retention_offer_sent_at ? 'Oferta Enviada' : 'Enviar Oferta'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {cancels.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  Nenhum cancelamento recente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
