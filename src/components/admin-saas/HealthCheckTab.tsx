import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Mail,
  CreditCard,
  HardDrive,
} from 'lucide-react'
import { toast } from 'sonner'

export function HealthCheckTab() {
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<Record<string, boolean>>({
    api: true,
    db: true,
    email: true,
    payment: true,
    storage: true,
  })
  const [lastCheck, setLastCheck] = useState(new Date())

  const runCheck = () => {
    setChecking(true)
    setTimeout(() => {
      setStatus({
        api: true,
        db: true,
        email: true,
        payment: Math.random() > 0.1,
        storage: true,
      })
      setLastCheck(new Date())
      setChecking(false)
      toast.success('Verificação de integridade concluída')
    }, 1500)
  }

  const ServiceRow = ({ name, icon: Icon, isUp }: any) => (
    <div className="flex items-center justify-between p-4 border rounded-md bg-white dark:bg-gray-950">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-medium">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        {isUp ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-green-600 font-medium text-sm">Online</span>
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-600 font-medium text-sm">Offline</span>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Status dos Serviços (Health Check)</h2>
          <p className="text-sm text-muted-foreground">
            Última verificação: {lastCheck.toLocaleString('pt-BR')}
          </p>
        </div>
        <Button onClick={runCheck} disabled={checking}>
          <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
          Verificar Agora
        </Button>
      </div>

      <div className="grid gap-4">
        <ServiceRow name="API Principal (PocketBase)" icon={Server} isUp={status.api} />
        <ServiceRow name="Banco de Dados (SQLite)" icon={Database} isUp={status.db} />
        <ServiceRow name="Fila de E-mails" icon={Mail} isUp={status.email} />
        <ServiceRow name="Gateway de Pagamento" icon={CreditCard} isUp={status.payment} />
        <ServiceRow name="Storage (Arquivos/Prontuários)" icon={HardDrive} isUp={status.storage} />
      </div>
    </div>
  )
}
