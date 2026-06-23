import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { FileText, Lock, LockOpen } from 'lucide-react'

export default function SessionNotes() {
  const [notes, setNotes] = useState<any[]>([])

  useEffect(() => {
    pb.collection('session_notes')
      .getFullList({ expand: 'patient,professional', sort: '-created' })
      .then(setNotes)
      .catch(console.error)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prontuários</h1>
          <p className="text-gray-500 mt-1">Registros clínicos e evolução dos pacientes.</p>
        </div>
      </div>

      <div className="space-y-4">
        {notes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Nenhum prontuário registrado.
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="shadow-sm">
              <CardHeader className="py-4 border-b border-gray-100 bg-gray-50/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-teal-600" />
                    Paciente: {note.expand?.patient?.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Data: {new Date(note.created).toLocaleDateString('pt-BR')} • Psi:{' '}
                    {note.expand?.professional?.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {note.is_editable ? (
                    <span className="flex items-center text-xs text-green-600 font-medium">
                      <LockOpen className="h-3 w-3 mr-1" /> Editável
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-gray-500 font-medium">
                      <Lock className="h-3 w-3 mr-1" /> Fechado
                    </span>
                  )}
                  <Button variant="outline" size="sm">
                    Visualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="py-4">
                <p className="text-gray-700 line-clamp-2">
                  {note.content || note.soap_subjective || 'Sem conteúdo...'}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
