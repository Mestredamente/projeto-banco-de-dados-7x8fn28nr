import { useEffect, useState } from 'react'
import { FileText, Plus, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { AnamnesisWizardModal } from './AnamnesisWizardModal'

export function PatientAnamnesisTab({ patient }: { patient: any }) {
  const [anamnesis, setAnamnesis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)

  const loadAnamnesis = async () => {
    if (!patient?.id) return
    try {
      setLoading(true)
      const record = await pb.collection('anamnesis').getFirstListItem(`patient = '${patient.id}'`)
      setAnamnesis(record)
    } catch (e) {
      setAnamnesis(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (patient?.id) {
      loadAnamnesis()
    } else {
      setLoading(false)
    }
  }, [patient?.id])

  if (!patient?.id || loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {!anamnesis ? (
        <div className="text-center py-12 px-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma Anamnese Registrada</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            A anamnese é fundamental para compreender o contexto biopsicossocial do paciente antes
            de iniciar o tratamento.
          </p>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Iniciar Anamnese
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-teal-50 border border-teal-100 rounded-lg p-4">
            <div>
              <p className="text-teal-800 font-medium">Anamnese concluída</p>
              <p className="text-sm text-teal-600">
                Última atualização em {new Date(anamnesis.updated).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Button variant="outline" onClick={() => setWizardOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Ver / Editar Anamnese
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Queixa Principal</h4>
              <p className="text-gray-700 whitespace-pre-wrap">
                {anamnesis.complaint?.main_complaint || 'Não informada.'}
              </p>
              {anamnesis.complaint?.onset_details && (
                <div className="mt-2">
                  <span className="text-sm text-gray-500 font-medium">Início / Contexto:</span>
                  <p className="text-sm text-gray-700 mt-1">{anamnesis.complaint.onset_details}</p>
                </div>
              )}
            </div>

            <div className="bg-white border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Impressão Diagnóstica</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500 font-medium">CID Primário:</span>
                  <p className="text-sm text-gray-700">{anamnesis.diagnosis?.cid_primary || '-'}</p>
                </div>
                {anamnesis.diagnosis?.cid_secondary && (
                  <div>
                    <span className="text-sm text-gray-500 font-medium">CID Secundário:</span>
                    <p className="text-sm text-gray-700">{anamnesis.diagnosis.cid_secondary}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500 font-medium">Conduta Proposta:</span>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {anamnesis.diagnosis?.proposed_approach || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {wizardOpen && (
        <AnamnesisWizardModal
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          patient={patient}
          existingAnamnesis={anamnesis}
          onSuccess={loadAnamnesis}
        />
      )}
    </div>
  )
}
