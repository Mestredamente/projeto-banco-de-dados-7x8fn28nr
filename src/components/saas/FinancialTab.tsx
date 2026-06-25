import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/currency'
import { Badge } from '@/components/system/Badge'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/system/Skeleton'
import { ErrorState } from '@/components/system/ErrorState'
import { EmptyState } from '@/components/system/EmptyState'

export function FinancialTab() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        let financialData: any[] = []
        let hasRecords = false

        try {
          const res = await pb.collection('financial_records').getFullList({
            expand: 'professional,patient',
            sort: '-created',
          })
          if (res.length > 0) {
            hasRecords = true
            financialData = res.map((r) => ({
              id: r.id,
              name: r.expand?.professional?.name || r.expand?.patient?.name || 'Desconhecido',
              plan: r.type || 'Sessão',
              value: r.value || r.total || 0,
              status: r.status,
              startDate: new Date(r.created).toLocaleDateString('pt-BR'),
            }))
          }
        } catch (e) {
          console.warn("Coleção 'financial_records' indisponível ou erro:", e)
        }

        if (!hasRecords) {
          try {
            const subs = await pb.collection('subscriptions').getFullList({
              expand: 'plan,subscriber',
              filter: "status = 'active' || status = 'trial'",
              sort: '-created',
            })

            financialData = subs.map((s) => ({
              id: s.id,
              name: s.expand?.subscriber?.name || 'Assinante Desconhecido',
              plan: s.expand?.plan?.name || 'Sem plano',
              value: s.expand?.plan?.price || 0,
              status: s.status === 'active' ? 'pago' : 'pendente',
              startDate: new Date(s.created).toLocaleDateString('pt-BR'),
            }))
          } catch (e) {
            console.warn("Coleção 'subscriptions' indisponível ou erro:", e)
            if (financialData.length === 0) {
              throw new Error('Indisponível')
            }
          }
        }

        if (!isMounted) return
        setRecords(financialData)
      } catch (err: any) {
        if (isMounted) setError(err.message === 'Indisponível' ? 'Indisponível' : 'Erro interno')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  if (error) {
    return (
      <ErrorState
        title={error === 'Indisponível' ? 'Indisponível' : 'Erro de Carregamento'}
        message={
          error === 'Indisponível'
            ? 'Os dados financeiros não estão disponíveis no momento.'
            : 'Não foi possível carregar os registros financeiros.'
        }
      />
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton variant="table" count={5} />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <EmptyState
              title="Nenhum registro financeiro encontrado."
              description="As transações financeiras e pagamentos de assinaturas aparecerão aqui."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Plano / Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de início</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="capitalize">{r.plan}</TableCell>
                    <TableCell>{formatCurrency(r.value)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === 'pago' || r.status === 'active'
                            ? 'success'
                            : r.status === 'pendente'
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.startDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
