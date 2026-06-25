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
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export function PatientSessions({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState<any[]>([])

  const loadData = async () => {
    try {
      const records = await pb.collection('appointments').getFullList({
        filter: `patient = '${patientId}'`,
        sort: '-scheduled_date,-start_time',
        expand: 'professional',
      })
      setAppointments(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [patientId])

  useRealtime('appointments', () => {
    loadData()
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Sessões</CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma sessão encontrada.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell>
                    {apt.scheduled_date
                      ? new Date(apt.scheduled_date).toLocaleDateString('pt-BR')
                      : '-'}{' '}
                    {apt.start_time || ''}
                  </TableCell>
                  <TableCell className="capitalize">{apt.session_type || '-'}</TableCell>
                  <TableCell>{apt.expand?.professional?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {apt.status?.replace('_', ' ') || '-'}
                    </Badge>
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
