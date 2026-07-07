import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/system/Spinner'
import { Upload, Camera } from 'lucide-react'
import { validateImageFile, resizeImage } from '@/lib/image-utils'
import pb from '@/lib/pocketbase/client'
import { toast } from '@/hooks/use-toast'

interface ProfilePhotoUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  currentPhoto?: string
  onUploaded: () => void
}

export function ProfilePhotoUpload({
  open,
  onOpenChange,
  patientId,
  currentPhoto,
  onUploaded,
}: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || '')
      setPreview(null)
      setSelectedFile(null)
      return
    }
    setError('')
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !patientId) return
    setUploading(true)
    try {
      const resized = await resizeImage(selectedFile)
      const formData = new FormData()
      formData.append('profile_photo', resized)
      await pb.collection('patients').update(patientId, formData)
      toast({ title: 'Sucesso', description: 'Foto de perfil atualizada com sucesso.' })
      onUploaded()
      handleClose()
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a foto.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setPreview(null)
    setSelectedFile(null)
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Foto de Perfil</DialogTitle>
          <DialogDescription>
            Selecione uma imagem nos formatos JPG, PNG ou WebP (máx 5MB).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : currentPhoto ? (
              <img src={currentPhoto} alt="Atual" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload className="w-4 h-4 mr-2" />
            Selecionar imagem
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading && <Spinner size={16} className="mr-2" />}
            {uploading ? 'Enviando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
