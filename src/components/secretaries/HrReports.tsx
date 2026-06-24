import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function HrReports() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [selectedAsg, setSelectedAsg] = useState<string>('')
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

  const handleExport = async () => {
    if (!selectedAsg) return
    const asg = assignments.find((a) => a.id === selectedAsg)

    const start = format(startOfMonth(new Date(`${month}-01T00:00:00`)), 'yyyy-MM-dd')
    const end = format(endOfMonth(new Date(`${month}-01T00:00:00`)), 'yyyy-MM-dd')

    const entries = await pb.collection('time_entries').getFullList({
      filter: `secretary = "${asg.secretary}" && employer = "${asg.employer}" && created >= "${start} 00:00:00" && created <= "${end} 23:59:59"`,
      sort: 'created',
    })

    const days = eachDayOfInterval({
      start: new Date(`${start}T00:00:00`),
      end: new Date(`${end}T00:00:00`),
    })

    const rows = []
    rows.push('Data;Entrada;Inicio_Intervalo;Fim_Intervalo;Saida;Horas_Trabalhadas;Horas_Extras')

    let totalMinutes = 0

    for (const d of days) {
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayE = entries.filter((e) => e.created.startsWith(dateStr))

      const getT = (t: string) => dayE.find((e) => e.entry_type === t)?.created
      const ent = getT('entrada')
      const intI = getT('intervalo_inicio')
      const intF = getT('intervalo_fim')
      const sai = getT('saida')

      let workedMins = 0
      if (ent && sai) {
        let ms = new Date(sai).getTime() - new Date(ent).getTime()
        if (intI && intF) {
          ms -= new Date(intF).getTime() - new Date(intI).getTime()
        }
        workedMins = Math.floor(ms / 60000)
        totalMinutes += workedMins
      }

      const workedHrs = (workedMins / 60).toFixed(2)
      const contractedMins = 8 * 60
      const extraMins = Math.max(0, workedMins - contractedMins)
      const extraHrs = (extraMins / 60).toFixed(2)

      const fTime = (dStr: string | undefined) => (dStr ? format(new Date(dStr), 'HH:mm') : '')
      rows.push(
        `${format(d, 'dd/MM/yyyy')};${fTime(ent)};${fTime(intI)};${fTime(intF)};${fTime(sai)};${workedHrs};${extraHrs}`,
      )
    }

    const totalHrs = (totalMinutes / 60).toFixed(2)
    rows.push(`TOTAL;;;;;${totalHrs};`)

    const hrConf = asg.permissions?.hr || {}
    if (hrConf.commission_type && hrConf.commission_type !== 'none') {
      rows.push(
        `\nRegra de Comissao:;${hrConf.commission_type};Valor Ref:;${hrConf.commission_value}`,
      )
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `relatorio_rh_${asg.expand?.secretary?.name.replace(/ /g, '_')}_${month}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Secretária</label>
            <Select value={selectedAsg} onValueChange={setSelectedAsg}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.expand?.secretary?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mês/Ano</label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-[200px]"
            />
          </div>
          <Button onClick={handleExport} className="bg-teal-600 hover:bg-teal-700 text-white">
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Instruções do Relatório</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
            <li>O arquivo será baixado em formato CSV (.csv), compatível com Excel.</li>
            <li>Os dados utilizam separador ponto e vírgula (;) padrão no Brasil.</li>
            <li>
              O relatório inclui a totalização de horas trabalhadas e horas extras calculadas por
              dia.
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
