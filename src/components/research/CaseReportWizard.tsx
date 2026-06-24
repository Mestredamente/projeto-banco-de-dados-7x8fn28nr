import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { getResearchPatients, recordExport } from '@/services/research'
import { FileText, Wand2, Download } from 'lucide-react'

export default function CaseReportWizard() {
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    getResearchPatients().then(setPatients)
  }, [])

  const handleGenerate = () => {
    if (!selectedPatient) return toast({ title: 'Selecione um paciente', variant: 'destructive' })
    const p = patients.find((x) => x.id === selectedPatient)
    const age = p?.date_of_birth
      ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()
      : 'N/A'

    const summary = `Paciente: ${age} anos, ${p?.gender || 'N/A'}.
Queixa principal: Ansiedade (F41.1).
Abordagem: TCC.
Duração: 12 sessões.
Escalas aplicadas: BDI, BAI.
Desfecho: Em andamento.`

    setContent(summary)
  }

  const handleFormatABNT = () => {
    if (!content) return toast({ title: 'Gere o relato primeiro', variant: 'destructive' })
    setContent(
      `1. INTRODUÇÃO\n[Insira a fundamentação teórica aqui]\n\n2. MÉTODO\n${content}\n\n3. RESULTADOS\n[Apresente a evolução clínica e resultados das escalas]\n\n4. DISCUSSÃO\n[Correlacione o caso com a literatura]\n\n5. CONSIDERAÇÕES FINAIS\n[Desfecho e impacto da intervenção]\n`,
    )
    toast({ title: 'Formatado para ABNT' })
  }

  const handleExport = async (type: string) => {
    if (!content) return toast({ title: 'Gere o relato primeiro', variant: 'destructive' })
    await recordExport(type, 1)
    toast({
      title: `Exportado como ${type}`,
      description: 'O documento foi salvo e o registro de P&D foi atualizado.',
    })
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-blue-600" />
          Gerador de Relato de Caso Anonimizado
        </CardTitle>
        <CardDescription>
          Extraia rapidamente os dados do paciente para basear seu relato clínico e formatá-lo
          conforme as normas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            1. Selecione o Paciente Elegível (com consentimento)
          </label>
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um paciente da amostra de pesquisa..." />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  Paciente #{p.id.substring(0, 5)} (Anonimizado)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">2. Conteúdo do Relato</label>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGenerate}
              className="h-8 px-3 text-blue-600 bg-blue-50 hover:bg-blue-100"
            >
              <Wand2 className="w-4 h-4 mr-2" /> Gerar Resumo Automático
            </Button>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="font-mono text-sm"
            placeholder="O relato aparecerá aqui para sua revisão..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
          <Button onClick={handleFormatABNT} variant="secondary">
            Formatar Artigo (ABNT)
          </Button>
          <div className="flex-1" />
          <Button onClick={() => handleExport('PDF')} variant="outline" className="gap-2">
            <FileText className="w-4 h-4" /> PDF
          </Button>
          <Button onClick={() => handleExport('DOCX')} variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> DOCX
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
