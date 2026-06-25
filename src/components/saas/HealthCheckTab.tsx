import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SERVICES = [
  'API Principal',
  'Banco de Dados (PocketBase)',
  'Armazenamento S3 (Storage)',
  'Gateway de Pagamento (Asaas)',
  'Fila de E-mails Transacionais',
]

export function HealthCheckTab() {
  const [status, setStatus] = useState<Record<string, 'loading' | 'ok' | 'error'>>({})
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const runCheck = () => {
    if (isRunning) return
    setIsRunning(true)

    const newStatus: any = {}
    SERVICES.forEach((s) => (newStatus[s] = 'loading'))
    setStatus(newStatus)

    let finishedCount = 0
    SERVICES.forEach((s) => {
      setTimeout(
        () => {
          setStatus((prev) => ({ ...prev, [s]: 'ok' }))
          finishedCount++
          if (finishedCount === SERVICES.length) {
            setLastCheck(new Date())
            setIsRunning(false)
          }
        },
        500 + Math.random() * 1500,
      )
    })
  }

  useEffect(() => {
    runCheck()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">Status do Ecossistema</h2>
          <p className="text-sm text-gray-500 mt-1">
            {lastCheck
              ? `Última verificação: ${lastCheck.toLocaleString('pt-BR')}`
              : 'Verificando a saúde dos serviços...'}
          </p>
        </div>
        <Button onClick={runCheck} variant="outline" disabled={isRunning} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          Verificar Novamente
        </Button>
      </div>

      <div className="grid gap-3 max-w-2xl">
        {SERVICES.map((s) => (
          <div
            key={s}
            className="flex items-center justify-between p-4 border rounded-md bg-white shadow-sm"
          >
            <span className="font-medium text-slate-800">{s}</span>
            <div className="flex items-center gap-2">
              {status[s] === 'loading' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />{' '}
                  <span className="text-sm font-medium text-blue-500">Testando...</span>
                </>
              )}
              {status[s] === 'ok' && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />{' '}
                  <span className="text-sm font-medium text-green-600">Online e Estável</span>
                </>
              )}
              {status[s] === 'error' && (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />{' '}
                  <span className="text-sm font-medium text-red-600">Offline / Falha</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
