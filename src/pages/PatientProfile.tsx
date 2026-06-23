import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function PatientProfile() {
  const { id } = useParams()
  const [patient, setPatient] = useState<any>(null)

  useEffect(() => {
    if (id) {
      pb.collection('patients').getOne(id).then(setPatient).catch(console.error)
    }
  }, [id])

  if (!patient) return <div className="p-8 text-center">Carregando...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{patient.name}</h1>
        <p className="text-gray-500 mt-1">Perfil do Paciente</p>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="info">Informações Pessoais</TabsTrigger>
          <TabsTrigger value="history">Histórico Clínico</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Cadastrais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Email</span>
                <p className="font-medium">{patient.email || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Telefone</span>
                <p className="font-medium">{patient.phone || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">CPF</span>
                <p className="font-medium">{patient.cpf || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Nascimento</span>
                <p className="font-medium">
                  {patient.date_of_birth
                    ? new Date(patient.date_of_birth).toLocaleDateString('pt-BR')
                    : '-'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Contato de Emergência</span>
                <p className="font-medium">
                  {patient.emergency_contact_name || '-'} ({patient.emergency_contact_phone})
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Convênio</span>
                <p className="font-medium">{patient.health_insurance || 'Particular'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              O histórico de prontuários será listado aqui.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="financial" className="mt-6">
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              O histórico financeiro de consultas será listado aqui.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
