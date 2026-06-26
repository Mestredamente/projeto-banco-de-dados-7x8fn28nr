import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/system/Card'
import { BRAND } from '@/config/branding'

export default function Privacy() {
  const [content, setContent] = useState<string>('')
  const [date, setDate] = useState<string>('')

  useEffect(() => {
    pb.collection('system_settings')
      .getList(1, 1)
      .then((res) => {
        if (res.items.length > 0) {
          setContent(res.items[0].privacy_policy || 'Política não definida.')
          setDate(res.items[0].document_updated_at || '')
        }
      })
      .catch(console.error)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Política de Privacidade</h1>
          <p className="text-gray-500 mt-2">{BRAND.nomeCompleto}</p>
          {date && (
            <p className="text-sm text-gray-400 mt-1">
              Última atualização: {new Date(date).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        <Card>
          <CardContent className="p-8 prose max-w-none whitespace-pre-wrap">{content}</CardContent>
        </Card>
      </div>
    </div>
  )
}
