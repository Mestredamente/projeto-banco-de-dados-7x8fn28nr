import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, RefreshCw, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'

export function PatientInvitationsList() {
  const [invites, setInvites] = useState<any[]>([])

  const load = async () => {
    try {
      const records = await pb.collection('convites_paciente').getFullList({
        sort: '-created',
      })
      setInvites(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/convite/${token}`)
    toast({ title: 'Copiado', description: 'Link copiado para a área de transferência.' })
  }

  const cancelInvite = async (id: string) => {
    try {
      await pb.collection('convites_paciente').update(id, { status: 'cancelado' })
      toast({ title: 'Cancelado', description: 'O convite foi cancelado.' })
      load()
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar o convite.',
        variant: 'destructive',
      })
    }
  }

  const resendInvite = async (id: string) => {
    try {
      await pb.send(`/backend/v1/invitations/${id}/resend`, { method: 'POST' })
      toast({ title: 'Reenviado', description: 'Um novo token foi gerado.' })
      load()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="border rounded-lg bg-white dark:bg-gray-900">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Data de Envio</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                Nenhum convite enviado.
              </TableCell>
            </TableRow>
          ) : (
            invites.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.paciente_nome}</TableCell>
                <TableCell>{inv.paciente_email}</TableCell>
                <TableCell>
                  {format(new Date(inv.created), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      inv.status === 'ativo'
                        ? 'default'
                        : inv.status === 'utilizado'
                          ? 'secondary'
                          : 'destructive'
                    }
                    className={
                      inv.status === 'ativo' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''
                    }
                  >
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {inv.status === 'ativo' && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Copiar Link"
                        onClick={() => copyLink(inv.token)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Cancelar"
                        onClick={() => cancelInvite(inv.id)}
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  )}
                  {(inv.status === 'cancelado' || inv.status === 'expirado') && (
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Reenviar"
                      onClick={() => resendInvite(inv.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
