import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FinancialFormModal } from './FinancialFormModal'
import { CycleBillingModal } from './CycleBillingModal'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, CalendarDays } from 'lucide-react'
import { useFinancialFilter } from '@/hooks/use-financial-filter'
import { buildFinancialFilter } from '@/services/financial-records'

export function FinancialRecords() {
  const [records, setRecords] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [cycleModalOpen, setCycleModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const { professionalId, clinicId, isAdminRole } = useFinancialFilter()

  const load = async () => {
    try {
      const filter = buildFinancialFilter({ professionalId, clinicId, isAdminRole })
      const res = await pb.collection('financial_records').getFullList({
        filter,
        sort: '-created',
        expand: 'patient',
      })
      setRecords(res)
    } catch (e) {
      toast.error('Erro ao carregar lançamentos')
    }
  }

  useEffect(() => {
    load()
  }, [professionalId, clinicId, isAdminRole])

  const handleRefund = async (record: any) => {
    const reason = window.prompt('Motivo do estorno (obrigatório):')
    if (!reason) {
      toast.warning('O motivo é obrigatório para processar estornos.')
      return
    }
    try {
      await pb.collection('financial_records').update(record.id, {
        status: 'estornado',
        notes: (record.notes ? record.notes + '\n' : '') + `Estorno autorizado. Motivo: ${reason}`,
      })
      toast.success('Estorno realizado e auditado com sucesso')
      load()
    } catch (e) {
      toast.error('Erro ao realizar estorno')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold">Lançamentos</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setCycleModalOpen(true)}>
            <CalendarDays className="w-4 h-4 mr-2" /> Fechar Ciclo
          </Button>
          <Button
            onClick={() => {
              setSelectedRecord(null)
              setModalOpen(true)
            }}
          >
            Novo Lançamento
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data Venc.</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  {r.due_date ? format(new Date(r.due_date), 'dd/MM/yyyy') : '-'}
                </TableCell>
                <TableCell>{r.expand?.patient?.name || '-'}</TableCell>
                <TableCell className="capitalize">{r.type}</TableCell>
                <TableCell>{formatCurrency(r.total || 0)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.status === 'pago'
                        ? 'default'
                        : r.status === 'atrasado'
                          ? 'destructive'
                          : r.status === 'estornado'
                            ? 'outline'
                            : 'secondary'
                    }
                  >
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedRecord(r)
                          setModalOpen(true)
                        }}
                      >
                        Editar / Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRefund(r)} className="text-red-600">
                        Registrar Estorno
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Nenhum lançamento encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <FinancialFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={load}
        defaultValues={selectedRecord}
      />
      <CycleBillingModal open={cycleModalOpen} onOpenChange={setCycleModalOpen} />
    </div>
  )
}
