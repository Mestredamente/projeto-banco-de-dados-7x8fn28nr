import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/system/ErrorState'
import { EmptyState } from '@/components/system/EmptyState'
import pb from '@/lib/pocketbase/client'
import { Building2 } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { useManagerFilter } from '@/hooks/use-manager-filter'

export default function Clinics() {
  const [clinics, setClinics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isSaaSAdmin, clinicIds } = useManagerFilter()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let filter: string | undefined
      if (!isSaaSAdmin) {
        if (clinicIds.length === 0) {
          setClinics([])
          return
        }
        filter = clinicIds.map((id) => `id="${id}"`).join(' || ')
      }

      const records = await pb.collection('clinics').getFullList({
        filter,
        sort: 'name',
      })
      setClinics(records)
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar as clínicas.')
    } finally {
      setLoading(false)
    }
  }, [isSaaSAdmin, clinicIds])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('clinics', () => {
    loadData()
  })

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clínicas</h1>
          <p className="text-gray-500 mt-1">Gerenciamento de filiais e parceiros.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clínicas</h1>
          <p className="text-gray-500 mt-1">Gerenciamento de filiais e parceiros.</p>
        </div>
        <ErrorState title="Erro de Carregamento" message={error} onRetry={loadData} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clínicas</h1>
        <p className="text-gray-500 mt-1">Gerenciamento de filiais e parceiros.</p>
      </div>

      {clinics.length === 0 ? (
        <EmptyState
          context="custom"
          title="Nenhuma clínica encontrada"
          description="Não há clínicas cadastradas ou disponíveis para visualização no momento."
        />
      ) : (
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
                    <strong>CNPJ:</strong> {clinic.cnpj || '-'}
                  </p>
                  <p>
                    <strong>Endereço:</strong> {clinic.address || clinic.address_street || '-'}
                  </p>
                  <p>
                    <strong>Telefone:</strong> {clinic.phone || '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
