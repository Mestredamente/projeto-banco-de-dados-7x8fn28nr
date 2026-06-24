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
import { Button } from '@/components/ui/button'

export default function RoomsTab() {
  const [rooms, setRooms] = useState<any[]>([])

  useEffect(() => {
    pb.collection('rooms')
      .getFullList()
      .then(setRooms)
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Salas da Clínica</h2>
            <p className="text-sm text-muted-foreground">
              Cadastre e gerencie a estrutura física da clínica.
            </p>
          </div>
          <Button>Adicionar Sala</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Sala</TableHead>
              <TableHead>Capacidade</TableHead>
              <TableHead>Recursos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.capacity} pessoas</TableCell>
                <TableCell>{r.resources?.items?.join(', ') || '-'}</TableCell>
              </TableRow>
            ))}
            {rooms.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Nenhuma sala cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="bg-card p-4 rounded-xl border shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Mapa de Ocupação Semanal</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Esta sala tem <strong>65%</strong> de ocupação esta semana. Horários livres mais próximos:
          Sexta 14:00, 15:00.
        </p>
        <div className="h-64 bg-muted/10 rounded-md border-2 border-dashed flex items-center justify-center">
          <span className="text-muted-foreground">
            Grade do mapa de ocupação semanal (Exibição Dinâmica)
          </span>
        </div>
      </div>
    </div>
  )
}
