import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/components/ui/use-toast'

export function PatientScales({ patientId }: { patientId: string }) {
  const [assignments, setAssignments] = useState<any[]>([])

  const loadData = async () => {
    try {
      const records = await pb.collection('questionnaire_assignments').getFullList({
        filter: `patient = '${patientId}'`,
        sort: '-created',
        expand: 'questionnaire',
      })
      setAssignments(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [patientId])

  useRealtime('questionnaire_assignments', () => {
    loadData()
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escalas e Questionários</CardTitle>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma escala aplicada.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Escala / Questionário</TableHead>
                <TableHead>Data de Aplicação</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {a.expand?.questionnaire?.title || '-'}
                  </TableCell>
                  <TableCell>
                    {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    {a.due_date ? new Date(a.due_date).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="capitalize"
                      variant={
                        a.status === 'respondido'
                          ? 'default'
                          : a.status === 'expirado'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {a.status === 'respondido' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toast({
                            title: 'Respostas',
                            description: 'Visualização de respostas em breve.',
                          })
                        }
                      >
                        Ver Respostas
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
