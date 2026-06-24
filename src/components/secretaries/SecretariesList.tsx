import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, PowerOff } from 'lucide-react'
import SecretaryFormModal from './SecretaryFormModal'
import { toast } from 'sonner'

export default function SecretariesList() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingAsg, setEditingAsg] = useState<any>(null)

  const load = async () => {
    try {
      const data = await pb.collection('secretary_assignments').getFullList({
        filter: `employer = "${pb.authStore.record?.id}"`,
        expand: 'secretary',
      })
      setAssignments(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const activeCount = assignments.filter((a) => a.is_active).length
  const limitReached = activeCount >= 1

  const handleTerminate = async (id: string) => {
    if (
      confirm(
        'Ao desligar, o acesso ao sistema será bloqueado. Deseja manter o histórico de ponto? [OK para confirmar o desligamento]',
      )
    ) {
      try {
        await pb.collection('secretary_assignments').update(id, { is_active: false })
        toast.success('Secretária desligada com sucesso')
        load()
      } catch (e) {
        toast.error('Erro ao desligar')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Secretárias Ativas ({activeCount}/1)</h2>
        <Button
          onClick={() => {
            if (limitReached) {
              toast.error('Você atingiu o limite de 1 secretária.', {
                action: {
                  label: 'SIM, contratar (+ R$ 29/mês)',
                  onClick: () => alert('Recurso premium.'),
                },
              })
              return
            }
            setEditingAsg(null)
            setIsModalOpen(true)
          }}
          className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Nova Secretária
        </Button>
      </div>

      {assignments.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            Você ainda não possui nenhuma secretária cadastrada.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {assignments.map((asg) => (
          <Card key={asg.id} className={!asg.is_active ? 'opacity-60 bg-muted/50' : ''}>
            <CardContent className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{asg.expand?.secretary?.name}</h3>
                  {!asg.is_active && <Badge variant="secondary">Desligada</Badge>}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Email: {asg.expand?.secretary?.email}</p>
                  <p>Contrato: {asg.permissions?.hr?.contract_type || 'N/A'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {asg.is_active ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingAsg(asg)
                        setIsModalOpen(true)
                      }}
                    >
                      Editar / Permissões
                    </Button>
                    <Button variant="destructive" onClick={() => handleTerminate(asg.id)}>
                      <PowerOff className="mr-2 h-4 w-4" /> Desligar
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (limitReached) {
                        toast.error('Limite de 1 secretária ativa atingido.')
                        return
                      }
                      pb.collection('secretary_assignments')
                        .update(asg.id, { is_active: true })
                        .then(() => {
                          toast.success('Reativada')
                          load()
                        })
                    }}
                  >
                    Reativar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <SecretaryFormModal
          assignment={editingAsg}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={load}
        />
      )}
    </div>
  )
}
