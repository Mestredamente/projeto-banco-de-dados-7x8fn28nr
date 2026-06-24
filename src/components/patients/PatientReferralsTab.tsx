import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'

const STATUS_COLORS: Record<string, string> = {
  Enviado: 'bg-blue-100 text-blue-800',
  Aceito: 'bg-yellow-100 text-yellow-800',
  '1ª Sessão': 'bg-green-100 text-green-800',
  Finalizado: 'bg-gray-100 text-gray-800',
  Recusado: 'bg-red-100 text-red-800',
}

export function PatientReferralsTab({ patientId }: { patientId: string }) {
  const [referrals, setReferrals] = useState<any[]>([])

  const loadReferrals = async () => {
    try {
      const res = await pb.collection('referrals').getFullList({
        filter: `patient = '${patientId}'`,
        sort: '-created',
        expand: 'destination,source',
      })
      setReferrals(res)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadReferrals()
  }, [patientId])
  useRealtime('referrals', loadReferrals)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Encaminhamentos</CardTitle>
      </CardHeader>
      <CardContent>
        {referrals.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum encaminhamento registrado.</p>
        ) : (
          <div className="space-y-4">
            {referrals.map((ref) => (
              <div key={ref.id} className="p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{ref.specialty}</h4>
                    <p className="text-sm text-gray-500">
                      Para: {ref.expand?.destination?.name || 'Profissional'}
                      <span className="mx-2">•</span>
                      {new Date(ref.created).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge className={STATUS_COLORS[ref.status] || 'bg-gray-100'}>{ref.status}</Badge>
                </div>
                <p className="text-sm text-gray-700 mt-2">{ref.justification}</p>
                <div className="mt-3 text-xs text-gray-400 font-mono">Token: {ref.token}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ReferralDialog({
  patient,
  open,
  onOpenChange,
}: {
  patient: any
  open: boolean
  onOpenChange: (val: boolean) => void
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [specialty, setSpecialty] = useState('')
  const [justification, setJustification] = useState('')
  const [destination, setDestination] = useState('')
  const [professionals, setProfessionals] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      pb.collection('users')
        .getFullList({ filter: "role ~ 'psicologo'" })
        .then((res) => {
          setProfessionals(res.filter((p) => p.id !== user?.id))
        })
    }
  }, [open, user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destination || !specialty)
      return toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })

    setLoading(true)
    try {
      await pb.collection('referrals').create({
        patient: patient.id,
        source: user?.id,
        destination,
        specialty,
        justification,
        status: 'Enviado',
      })
      toast({ title: 'Encaminhamento enviado com sucesso' })
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Erro ao enviar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Encaminhar Paciente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Especialidade Necessária</Label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a especialidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Psiquiatria">Psiquiatria</SelectItem>
                  <SelectItem value="Neuropsicologia">Neuropsicologia</SelectItem>
                  <SelectItem value="Psicopedagogia">Psicopedagogia</SelectItem>
                  <SelectItem value="Terapia de Casal">Terapia de Casal</SelectItem>
                  <SelectItem value="Terapia Infantil">Terapia Infantil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Profissional Destino</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.crp ? `(${p.crp})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Justificativa Clínica</Label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Resumo do caso e motivo do encaminhamento (dados serão anonimizados no envio)..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Confirmar Encaminhamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
