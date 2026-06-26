import { useState, useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Download, Link as LinkIcon, FileUp, File as FileIcon } from 'lucide-react'
import { EmptyState } from '@/components/system/EmptyState'

export function DocumentsList() {
  const [docs, setDocs] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    try {
      const [docsRes, patRes] = await Promise.all([
        pb
          .collection('telepsicologia_documents')
          .getFullList({ expand: 'patient', sort: '-created' }),
        pb.collection('patients').getFullList({ filter: 'is_active = true', sort: 'name' }),
      ])
      setDocs(docsRes)
      setPatients(patRes)
    } catch {
      /* intentionally ignored */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async () => {
    if (!patientId || !name || !file)
      return toast.error('Preencha todos os campos e anexe um arquivo')
    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('patient', patientId)
      fd.append('professional', pb.authStore.record!.id)
      fd.append('file', file)

      await pb.collection('telepsicologia_documents').create(fd)
      toast.success('Documento compartilhado!')
      setCreateModal(false)
      setName('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      loadData()
    } catch (e) {
      toast.error('Erro ao enviar documento')
    }
  }

  const copyLink = (d: any) => {
    const url = pb.files.getURL(d, d.file)
    navigator.clipboard.writeText(url)
    toast.success('Link do arquivo copiado!')
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Documentos Compartilhados</h3>
        <Button onClick={() => setCreateModal(true)}>
          <FileUp className="w-4 h-4 mr-2" /> Compartilhar Documento
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome do Arquivo</th>
              <th className="px-4 py-3 font-medium">Paciente</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {docs.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-4 py-12">
                  <EmptyState
                    icon={FileIcon}
                    title="Nenhum documento"
                    description="Compartilhe materiais de apoio ou recibos com seus pacientes."
                  />
                </td>
              </tr>
            )}
            {docs.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  <FileIcon className="w-4 h-4 text-primary" /> {d.name}
                </td>
                <td className="px-4 py-3">{d.expand?.patient?.name}</td>
                <td className="px-4 py-3">{format(new Date(d.created), 'dd/MM/yyyy')}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => copyLink(d)}>
                    <LinkIcon className="w-4 h-4 mr-1" /> Copiar Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(pb.files.getURL(d, d.file), '_blank')}
                  >
                    <Download className="w-4 h-4 mr-1" /> Baixar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar Novo Documento</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do Documento</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Material de Apoio - Ansiedade"
              />
            </div>
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Enviar Arquivo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
