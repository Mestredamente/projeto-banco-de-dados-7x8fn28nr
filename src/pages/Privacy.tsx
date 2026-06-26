import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Privacy() {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pb.collection('system_settings')
      .getFirstListItem('')
      .then((res) => {
        setContent(res.privacy_policy || '<p>Política de Privacidade não definida no sistema.</p>')
      })
      .catch(() => {
        setContent('<p>Política de Privacidade indisponível no momento.</p>')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Política de Privacidade - Syntrapsi</h1>
      <Card className="shadow-sm">
        <CardContent className="p-8 prose prose-blue max-w-none prose-headings:text-primary prose-a:text-blue-600">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[95%]" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-full mt-8" />
              <Skeleton className="h-4 w-[85%]" />
            </div>
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: content.replace(/Syntra(?!\w)/g, 'Syntrapsi') }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
