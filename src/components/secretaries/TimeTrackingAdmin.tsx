import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function TimeTrackingAdmin() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [selectedAsg, setSelectedAsg] = useState<string>('')
  const [entries, setEntries] = useState<any[]>([])
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))

  useEffect(() => {
    pb.collection('secretary_assignments')
      .getFullList({
        filter: `employer = "${pb.authStore.record?.id}" && is_active = true`,
        expand: 'secretary',
      })
      .then((res) => {
        setAssignments(res)
        if (res.length > 0) setSelectedAsg(res[0].id)
      })
  }, [])

  useEffect(() => {
    if (!selectedAsg) return
    const asg = assignments.find((a) => a.id === selectedAsg)
    if (!asg) return

    const start = format(startOfMonth(new Date(`${month}-01T00:00:00`)), 'yyyy-MM-dd')
    const end = format(endOfMonth(new Date(`${month}-01T00:00:00`)), 'yyyy-MM-dd')

    pb.collection('time_entries')
      .getFullList({
        filter: `secretary = "${asg.secretary}" && employer = "${asg.employer}" && created >= "${start} 00:00:00" && created <= "${end} 23:59:59"`,
        sort: 'created',
      })
      .then(setEntries)
  }, [selectedAsg, month, assignments])

  const days = eachDayOfInterval({
    start: startOfMonth(new Date(`${month}-01T00:00:00`)),
    end: endOfMonth(new Date(`${month}-01T00:00:00`)),
  })

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayEntries = entries.filter((e) => e.created.startsWith(todayStr))
  const noClockInAlert =
    new Date().getHours() >= 10 &&
    !isWeekend(new Date()) &&
    todayEntries.length === 0 &&
    todayStr.startsWith(month)

  let totalMins = 0
  days.forEach((d) => {
    if (isWeekend(d)) return
    const dStr = format(d, 'yyyy-MM-dd')
    const dayE = entries.filter((e) => e.created.startsWith(dStr))
    const ent = dayE.find((e) => e.entry_type === 'entrada')?.created
    const sai = dayE.find((e) => e.entry_type === 'saida')?.created
    if (ent && sai) {
      let ms = new Date(sai).getTime() - new Date(ent).getTime()
      const intI = dayE.find((e) => e.entry_type === 'intervalo_inicio')?.created
      const intF = dayE.find((e) => e.entry_type === 'intervalo_fim')?.created
      if (intI && intF) {
        ms -= new Date(intF).getTime() - new Date(intI).getTime()
      }
      totalMins += Math.floor(ms / 60000)
    }
  })

  const weekdaysCount = days.filter((d) => !isWeekend(d)).length
  const contractedMins = weekdaysCount * 8 * 60
  const extraHours = Math.max(0, (totalMins - contractedMins) / 60).toFixed(1)
  const bankHours = ((totalMins - contractedMins) / 60).toFixed(1)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-4 mb-4">
        <Select value={selectedAsg} onValueChange={setSelectedAsg}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Selecione a secretária" />
          </SelectTrigger>
          <SelectContent>
            {assignments.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.expand?.secretary?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-[200px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {noClockInAlert && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center gap-3 col-span-1 md:col-span-3">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">
              Atenção: A secretária não bateu o ponto de entrada hoje (após as 10:00).
            </p>
          </div>
        )}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Horas Extras no Mês</p>
            <p className="text-2xl font-bold text-teal-600">{extraHours}h</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Banco de Horas (Saldo)</p>
            <p
              className={`text-2xl font-bold ${Number(bankHours) >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {Number(bankHours) > 0 ? '+' : ''}
              {bankHours}h
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Início Intervalo</TableHead>
                <TableHead>Fim Intervalo</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map((d) => {
                const dateStr = format(d, 'yyyy-MM-dd')
                const dayEntries = entries.filter((e) => e.created.startsWith(dateStr))

                const getByT = (type: string) => dayEntries.find((e) => e.entry_type === type)
                const ent = getByT('entrada')
                const intI = getByT('intervalo_inicio')
                const intF = getByT('intervalo_fim')
                const sai = getByT('saida')

                const isWknd = isWeekend(d)

                return (
                  <TableRow key={dateStr} className={isWknd ? 'bg-muted/30' : ''}>
                    <TableCell className="font-medium min-w-[150px]">
                      {format(d, 'dd/MM/yyyy')}{' '}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({format(d, 'EEE', { locale: ptBR })})
                      </span>
                    </TableCell>
                    <TableCell>{ent ? format(new Date(ent.created), 'HH:mm') : '-'}</TableCell>
                    <TableCell>{intI ? format(new Date(intI.created), 'HH:mm') : '-'}</TableCell>
                    <TableCell>{intF ? format(new Date(intF.created), 'HH:mm') : '-'}</TableCell>
                    <TableCell>{sai ? format(new Date(sai.created), 'HH:mm') : '-'}</TableCell>
                    <TableCell>
                      {!isWknd && dayEntries.length === 0 && dateStr < todayStr ? (
                        <Badge variant="destructive">Falta</Badge>
                      ) : (
                        dayEntries.length > 0 && (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            Presente
                          </Badge>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
