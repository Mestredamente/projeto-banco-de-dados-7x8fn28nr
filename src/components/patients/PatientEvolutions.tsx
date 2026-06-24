import { useState, useEffect } from 'react'
import { Plus, Search, Lock, LockOpen, Paperclip } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'
import { EvolutionFormModal } from './EvolutionFormModal'

export function PatientEvolutions({ patientId }: { patientId: string }) {
  const [evolutions, setEvolutions] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvolution, setSelectedEvolution] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadEvolutions = async () => {
    try {
      let filter = `patient = '${patientId}'`
      if (searchTerm) {
        filter += ` && content ~ '${searchTerm}'`
      }
      const records = await pb.collection('session_notes').getFullList({
        filter,
        sort: '-session_date',
      })
      setEvolutions(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadEvolutions()
  }, [patientId, searchTerm])

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar nas evoluções..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            setSelectedEvolution(null)
            setIsModalOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Evolução
        </Button>
      </div>

      <div className="space-y-4">
        {evolutions.length === 0 ? (
          <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
            Nenhuma evolução encontrada.
          </div>
        ) : (
          evolutions.map((ev) => (
            <Card
              key={ev.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedEvolution(ev)
                setIsModalOpen(true)
              }}
            >
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">Sessão {ev.session_number}</span>
                    <Badge variant="secondary">{ev.evolution_type || 'Evolução padrão'}</Badge>
                    {ev.attachments && ev.attachments.length > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" /> {ev.attachments.length}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>
                      {new Date(ev.session_date || ev.created).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                    {ev.status === 'finalizado' ? (
                      <span className="flex items-center text-green-600">
                        <Lock className="h-3 w-3 mr-1" /> Finalizado
                      </span>
                    ) : (
                      <span className="flex items-center text-orange-600">
                        <LockOpen className="h-3 w-3 mr-1" /> Rascunho
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {ev.content || 'Sem conteúdo.'}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <EvolutionFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        patientId={patientId}
        evolution={selectedEvolution}
        onSaved={loadEvolutions}
      />
    </div>
  )
}
