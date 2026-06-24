import { useState } from 'react'
import { MessageSquare, Star, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

export function GlobalFeedback() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!user) return null

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Avaliação necessária',
        description: 'Por favor, selecione uma nota de 1 a 5 estrelas.',
        variant: 'destructive',
      })
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('user', user.id)
      formData.append('rating', rating.toString())
      formData.append('comment', comment)
      formData.append('system_version', '1.0.0') // Usually populated from package.json or env
      if (file) {
        formData.append('screenshot', file)
      }
      await pb.collection('feedbacks').create(formData)
      toast({
        title: 'Feedback recebido',
        description: 'Obrigado! Sua opinião nos ajuda a melhorar.',
      })
      setIsOpen(false)
      setRating(0)
      setComment('')
      setFile(null)
    } catch (e: any) {
      toast({ title: 'Erro ao enviar feedback', description: e.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-teal-600 hover:bg-teal-700 p-0 flex items-center justify-center transition-transform hover:scale-105 z-50 group"
      >
        <MessageSquare className="h-6 w-6 text-white group-hover:animate-bounce" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Envie seu Feedback</DialogTitle>
            <DialogDescription>
              Sua opinião é fundamental para a evolução contínua do Syntra.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Deixe suas sugestões, críticas ou relate um problema que você encontrou..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[120px]"
            />
            <div>
              <input
                type="file"
                id="screenshot"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  asChild
                  size="sm"
                  className="bg-gray-50 border-gray-200 text-gray-700"
                >
                  <label htmlFor="screenshot" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2 text-gray-500" />
                    Anexar Screenshot
                  </label>
                </Button>
                {file && (
                  <div className="text-xs text-teal-700 font-medium flex items-center bg-teal-50 px-2 py-1 rounded">
                    {file.name}
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="ml-2 text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Arquivos JPG, PNG ou WEBP até 5MB.</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {submitting ? 'Enviando...' : 'Enviar Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
