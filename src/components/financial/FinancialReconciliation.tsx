import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UploadCloud, CheckCircle2, AlertTriangle, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/currency'
import { Badge } from '@/components/ui/badge'

export function FinancialReconciliation() {
  const [file, setFile] = useState<File | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      toast.success('Arquivo lido com sucesso! Processando conciliação automática...')
      // Mock parsing OFX/PDF
      setTimeout(() => {
        setTransactions([
          {
            id: 1,
            date: '20/06/2026',
            desc: 'PIX TRANSFERENCIA - João Silva (CPF: ***.123.456-**)',
            value: 150.0,
            match: 'João Silva',
            status: 'matched',
          },
          {
            id: 2,
            date: '21/06/2026',
            desc: 'PAGTO CARTAO',
            value: 300.0,
            match: null,
            status: 'unidentified',
          },
          {
            id: 3,
            date: '22/06/2026',
            desc: 'PIX TRANSFERENCIA - Maria Souza (CPF: ***.987.654-**)',
            value: 140.0,
            match: 'Maria Souza',
            status: 'alert',
            alertMsg: 'Valor recebido (R$ 140) difere do esperado (R$ 150)',
          },
        ])
      }, 1000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Conciliação Bancária</h2>
          <p className="text-muted-foreground text-sm">
            Importe arquivos OFX ou PDF para conciliação automática via CPF/CNPJ.
          </p>
        </div>
        <div>
          <Input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".ofx,.pdf"
            onChange={handleUpload}
          />
          <Button asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              <UploadCloud className="w-4 h-4 mr-2" />{' '}
              {file ? 'Importar Outro' : 'Importar Extrato'}
            </label>
          </Button>
        </div>
      </div>

      {transactions.length > 0 ? (
        <div className="grid gap-3 mt-6">
          <h3 className="font-semibold mt-2">Transações Encontradas</h3>
          {transactions.map((t) => (
            <Card
              key={t.id}
              className={t.status === 'alert' ? 'border-orange-200 bg-orange-50/30' : ''}
            >
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <p className="font-semibold text-sm">
                      {t.date} • {t.desc}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-green-700">{formatCurrency(t.value)}</p>
                  {t.status === 'alert' && (
                    <p className="text-sm text-orange-600 flex items-center mt-1 font-medium">
                      <AlertTriangle className="w-4 h-4 mr-1" /> {t.alertMsg}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {t.status === 'matched' && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Conciliado: {t.match}
                    </Badge>
                  )}
                  {t.status === 'unidentified' && (
                    <Button variant="outline" size="sm">
                      Vincular Paciente
                    </Button>
                  )}
                  {t.status === 'alert' && (
                    <Button variant="secondary" size="sm">
                      Verificar Discrepância
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-900 mt-6">
          <UploadCloud className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">
            Nenhum extrato importado. Faça o upload de um arquivo OFX ou PDF do seu banco.
          </p>
        </div>
      )}
    </div>
  )
}
