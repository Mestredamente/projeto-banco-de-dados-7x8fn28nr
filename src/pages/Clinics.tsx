import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { Building2 } from 'lucide-react'

export default function Clinics() {
  const [clinics, setClinics] = useState<any[]>([])

  useEffect(() => {
    pb.collection('clinics').getFullList().then(setClinics).catch(console.error)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clínicas</h1>
        <p className="text-gray-500 mt-1">Gerenciamento de filiais e parceiros.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clinics.map((clinic) => (
          <Card key={clinic.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-teal-100 text-teal-700 rounded-lg">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{clinic.name}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${clinic.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {clinic.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>CNPJ:</strong> {clinic.cnpj}
                </p>
                <p>
                  <strong>Endereço:</strong> {clinic.address}
                </p>
                <p>
                  <strong>Telefone:</strong> {clinic.phone}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
