import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import useRealtime from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function Agenda() {
  const [appointments, setAppointments] = useState<any[]>([])

  const loadData = async () => {
    try {
      const records = await pb
        .collection('appointments')
        .getFullList({ expand: 'patient', sort: '-scheduled_date' })
      setAppointments(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('appointments', () => {
    loadData()
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agenda</h1>
          <p className="text-gray-500 mt-1">Gerencie seus compromissos e consultas.</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {appointments.length === 0 ? (
              <p className="p-8 text-center text-gray-500">Nenhum agendamento encontrado.</p>
            ) : (
              appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex gap-4 items-center">
                    <div className="text-center min-w-[80px]">
                      <div className="text-sm font-semibold text-teal-600">
                        {new Date(apt.scheduled_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </div>
                      <div className="text-xl font-bold">
                        {new Date(apt.scheduled_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="border-l-2 border-gray-200 pl-4">
                      <p className="font-semibold text-lg">
                        {apt.expand?.patient?.name || 'Paciente não encontrado'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {apt.session_type || 'Sessão regular'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        apt.status === 'agendado'
                          ? 'bg-blue-100 text-blue-800'
                          : apt.status === 'realizado'
                            ? 'bg-green-100 text-green-800'
                            : apt.status === 'cancelado'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {apt.status}
                    </span>
                    <Button variant="outline" size="sm">
                      Detalhes
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
