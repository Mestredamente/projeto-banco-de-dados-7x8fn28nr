import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function AnalyticsTab() {
  const topUsers = [
    {
      id: 1,
      name: 'Dr. Roberto Almeida',
      sessions: 145,
      storage: '1.2 GB',
      lastLogin: 'Há 2 horas',
    },
    { id: 2, name: 'Dra. Ana Mendes', sessions: 132, storage: '900 MB', lastLogin: 'Hoje' },
    { id: 3, name: 'Clínica Mente Viva', sessions: 98, storage: '2.5 GB', lastLogin: 'Hoje' },
    { id: 4, name: 'Dr. Carlos Souza', sessions: 76, storage: '400 MB', lastLogin: 'Ontem' },
    { id: 5, name: 'Dra. Beatriz Santos', sessions: 65, storage: '350 MB', lastLogin: 'Há 3 dias' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Utilizadores (Ranking de Uso)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional / Clínica</TableHead>
                <TableHead className="text-right">Sessões (Mês)</TableHead>
                <TableHead className="text-right">Armazenamento</TableHead>
                <TableHead>Último Login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-right">{u.sessions}</TableCell>
                  <TableCell className="text-right">{u.storage}</TableCell>
                  <TableCell className="text-muted-foreground">{u.lastLogin}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
