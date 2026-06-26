import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { toast } from '@/hooks/use-toast'
import { Copy, Mail } from 'lucide-react'

export function InvitePatientModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await pb.send('/backend/v1/invitations', {
        method: 'POST',
        body: JSON.stringify({ nome, email }),
      })
      setToken(res.token)
      toast({ title: 'Sucesso', description: 'Convite gerado com sucesso.' })
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao gerar convite',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setNome('')
    setEmail('')
    setToken('')
    onOpenChange(false)
  }

  const inviteLink = `${window.location.origin}/convite/${token}`

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) reset()
        else onOpenChange(val)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Paciente</DialogTitle>
          <DialogDescription>
            Gere um link exclusivo para que o paciente crie sua própria conta.
          </DialogDescription>
        </DialogHeader>
        {!token ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Paciente</Label>
              <Input required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail do Paciente</Label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Gerando...' : 'Gerar Convite'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border flex items-center justify-between gap-4 overflow-hidden">
              <span className="text-sm font-mono truncate">{inviteLink}</span>
              <Button
                size="icon"
                variant="outline"
                className="shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink)
                  toast({
                    title: 'Copiado',
                    description: 'Link copiado para a área de transferência.',
                  })
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={reset}>
                Fechar
              </Button>
              <Button asChild>
                <a
                  href={`mailto:${email}?subject=Convite para o Syntrapsi&body=Olá ${encodeURIComponent(nome)},%0D%0A%0D%0AVocê foi convidado para acessar o portal do paciente.%0D%0AClique no link abaixo para criar sua conta:%0D%0A${encodeURIComponent(inviteLink)}`}
                >
                  <Mail className="h-4 w-4 mr-2" /> Enviar por E-mail
                </a>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
