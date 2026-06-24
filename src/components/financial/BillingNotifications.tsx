import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Mail, Send } from 'lucide-react'
import { toast } from 'sonner'

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'Lembrete de Vencimento',
    patient: 'João Silva',
    amount: 150,
    dueDate: '25/06/2026',
  },
  { id: 2, type: 'Aviso de Atraso', patient: 'Maria Souza', amount: 300, dueDate: '15/06/2026' },
]

export function BillingNotifications() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const handleApprove = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    toast.success('Notificação aprovada e enviada ao paciente!')
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Fila de Aprovação de Cobrança</h2>
        <p className="text-muted-foreground text-sm">
          Controle de comunicação: nenhuma cobrança é enviada automaticamente. Revise e aprove.
        </p>
      </div>

      <div className="grid gap-4 mt-4">
        {notifications.map((n) => (
          <Card key={n.id}>
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full dark:bg-blue-900/30">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{n.patient}</p>
                    <Badge variant={n.type === 'Aviso de Atraso' ? 'destructive' : 'secondary'}>
                      {n.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Valor a cobrar: R$ {n.amount.toFixed(2)} • Vencimento: {n.dueDate}
                  </p>
                </div>
              </div>
              <Button onClick={() => handleApprove(n.id)} className="w-full sm:w-auto">
                <Send className="w-4 h-4 mr-2" /> Aprovar Envio
              </Button>
            </CardContent>
          </Card>
        ))}
        {notifications.length === 0 && (
          <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg bg-slate-50 dark:bg-slate-900 mt-4">
            <Check className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Tudo em dia!</p>
            <p className="text-sm mt-1">Nenhuma notificação pendente de aprovação no momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
