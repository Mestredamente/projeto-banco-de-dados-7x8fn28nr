import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'
import { Paperclip, X, Download } from 'lucide-react'

export function EvolutionFormModal({ open, onOpenChange, patientId, evolution, onSaved }: any) {
  const { user } = useAuth()
  const isFinalizado = evolution?.status === 'finalizado'

  const [formData, setFormData] = useState({
    session_date: '',
    evolution_type: 'Evolução padrão',
    content: '',
    internal_observations: '',
  })
  const [files, setFiles] = useState<File[]>([])
  const [existingFiles, setExistingFiles] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (open) {
      if (evolution) {
        setFormData({
          session_date: format(
            new Date(evolution.session_date || evolution.created),
            "yyyy-MM-dd'T'HH:mm",
          ),
          evolution_type: evolution.evolution_type || 'Evolução padrão',
          content: evolution.content || '',
          internal_observations: evolution.internal_observations || '',
        })
        setExistingFiles(evolution.attachments || [])
        setFiles([])

        pb.send('/backend/v1/audit/view', {
          method: 'POST',
          body: JSON.stringify({ record_id: evolution.id, table_name: 'session_notes' }),
        }).catch(() => {})
      } else {
        setFormData({
          session_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          evolution_type: 'Evolução padrão',
          content: '',
          internal_observations: '',
        })
        setExistingFiles([])
        setFiles([])
      }
    }
  }, [open, evolution])

  const handleSave = async (status: 'rascunho' | 'finalizado') => {
    setIsUploading(true)
    try {
      const data = new FormData()
      data.append('patient', patientId)
      data.append('professional', user.id)
      data.append('session_date', new Date(formData.session_date).toISOString())
      data.append('evolution_type', formData.evolution_type)
      data.append('content', formData.content)
      data.append('internal_observations', formData.internal_observations)
      data.append('status', status)

      files.forEach((f) => {
        data.append('attachments', f)
      })

      if (evolution) {
        await pb.collection('session_notes').update(evolution.id, data)
        toast({ title: 'Evolução atualizada.' })
      } else {
        await pb.collection('session_notes').create(data)
        toast({ title: 'Evolução criada.' })
      }

      onSaved()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const valid = newFiles.filter((f) => f.size <= 10485760) // 10MB
      if (valid.length < newFiles.length) {
        toast({ title: 'Alguns arquivos excedem 10MB e foram ignorados.', variant: 'destructive' })
      }
      setFiles([...files, ...valid])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {evolution ? `Evolução Sessão ${evolution.session_number}` : 'Nova Evolução'}
          </DialogTitle>
          {isFinalizado && (
            <DialogDescription className="text-orange-600 font-medium">
              Esta evolução está finalizada e seu conteúdo clínico não pode mais ser alterado. Hash:{' '}
              {evolution.integrity_hash}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data e Hora</Label>
              <Input
                type="datetime-local"
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                disabled={isFinalizado}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Evolução</Label>
              <Select
                value={formData.evolution_type}
                onValueChange={(v) => setFormData({ ...formData, evolution_type: v })}
                disabled={isFinalizado}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Evolução padrão">Evolução padrão</SelectItem>
                  <SelectItem value="Intervenção em crise">Intervenção em crise</SelectItem>
                  <SelectItem value="Reavaliação">Reavaliação</SelectItem>
                  <SelectItem value="Relatório">Relatório</SelectItem>
                  <SelectItem value="Encaminhamento">Encaminhamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Texto da Evolução</Label>
            <Textarea
              className="min-h-[150px]"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              disabled={isFinalizado}
              placeholder="Descreva o andamento da sessão..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-purple-700">
              Observações Internas (Visível apenas para você)
            </Label>
            <Textarea
              className="min-h-[80px]"
              value={formData.internal_observations}
              onChange={(e) => setFormData({ ...formData, internal_observations: e.target.value })}
              placeholder="Notas pessoais, hipóteses..."
            />
          </div>

          <div className="space-y-2">
            <Label>Anexos (PDF, JPEG, PNG - máx 10MB)</Label>
            {!isFinalizado && (
              <Input
                type="file"
                multiple
                accept=".pdf,image/jpeg,image/png"
                onChange={handleFileChange}
              />
            )}

            <div className="flex flex-col gap-2 mt-2">
              {existingFiles.map((filename: string, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm border"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="h-4 w-4 text-gray-500 shrink-0" />
                    <span className="truncate">{filename}</span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={`${import.meta.env.VITE_POCKETBASE_URL}/api/files/session_notes/${evolution.id}/${filename}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
              {files.map((f, i) => (
                <div
                  key={`new-${i}`}
                  className="flex items-center justify-between bg-blue-50 p-2 rounded text-sm border border-blue-100"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="truncate">
                      {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          {isFinalizado ? (
            <Button onClick={() => handleSave('finalizado')} disabled={isUploading}>
              {isUploading ? 'Salvando...' : 'Salvar Observações Internas'}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleSave('rascunho')}
                disabled={isUploading}
              >
                {isUploading ? 'Salvando...' : 'Salvar como Rascunho'}
              </Button>
              <Button
                onClick={() => handleSave('finalizado')}
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isUploading ? 'Finalizando...' : 'Finalizar e Assinar'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
