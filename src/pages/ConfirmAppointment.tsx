import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ConfirmAppointment() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }
    pb.send('/backend/v1/appointments/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center shadow-lg border-teal-100 dark:border-teal-900">
        <CardHeader>
          <CardTitle className="text-2xl text-teal-700 dark:text-teal-400">
            Confirmação de Sessão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <p className="text-gray-600 dark:text-gray-400">Processando sua confirmação...</p>
          )}
          {status === 'success' && (
            <div className="space-y-2 animate-fade-in">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-green-700 font-medium dark:text-green-400">
                Sua sessão foi confirmada com sucesso!
              </p>
              <p className="text-sm text-gray-500">Aguardamos você no horário marcado.</p>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-2 animate-fade-in">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-red-700 font-medium dark:text-red-400">
                Link inválido ou expirado.
              </p>
              <p className="text-sm text-gray-500">
                Por favor, entre em contato diretamente com o seu profissional.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
