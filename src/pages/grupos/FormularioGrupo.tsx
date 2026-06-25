import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/use-auth'
import { useBranding } from '@/hooks/use-branding'
import pb from '@/lib/pocketbase/client'
import { createGrupo, getGrupo, updateGrupo } from '@/services/grupos'
import { Card } from '@/components/system/Card'
import { Input } from '@/components/system/Input'
import { Select } from '@/components/system/Select'
import { Textarea } from '@/components/system/Textarea'
import { Button } from '@/components/system/Button'
import { toast } from '@/components/ui/use-toast'

const schema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    descricao: z.string().optional(),
    psicologo_responsavel: z.string().optional(),
    tipo_grupo: z.enum(['psicoterapeutico', 'apoio', 'psicoeducativo', 'institucional']),
    abordagem: z.string().optional(),
    abordagem_outra: z.string().optional(),
    modalidade: z.enum(['aberto', 'fechado']),
    data_inicio: z.string().optional(),
    data_fim: z.string().optional(),
    vagas_total: z.coerce.number().min(1, 'No mínimo 1 vaga'),
    status: z.enum(['ativo', 'inativo', 'encerrado']),
    recorrencia: z.enum(['semanal', 'quinzenal', 'mensal']),
    dia_semana: z.enum(['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']),
    horario: z.string().min(1, 'Horário é obrigatório'),
    duracao_minutos: z.coerce.number().min(1),
    sala: z.string().optional(),
    publico_alvo: z.string().optional(),
    valor_mensalidade: z.coerce.number().optional(),
  })
  .refine(
    (data) => {
      if (data.tipo_grupo === 'psicoterapeutico' && !data.abordagem) return false
      return true
    },
    { message: 'Abordagem é obrigatória para grupo psicoterapêutico', path: ['abordagem'] },
  )
  .refine(
    (data) => {
      if (data.abordagem === 'outra' && !data.abordagem_outra) return false
      return true
    },
    { message: 'Especifique a abordagem', path: ['abordagem_outra'] },
  )
  .refine(
    (data) => {
      if (data.modalidade === 'fechado' && (!data.data_inicio || !data.data_fim)) return false
      return true
    },
    { message: 'Datas são obrigatórias para grupo fechado', path: ['data_inicio'] },
  )

type FormData = z.infer<typeof schema>

export default function FormularioGrupo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { clinic } = useBranding()
  const [loading, setLoading] = useState(false)
  const [profissionais, setProfissionais] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo_grupo: 'psicoterapeutico',
      modalidade: 'aberto',
      status: 'ativo',
      recorrencia: 'semanal',
      dia_semana: 'segunda',
      duracao_minutos: 90,
      vagas_total: 10,
    },
  })

  const tipo_grupo = watch('tipo_grupo')
  const abordagem = watch('abordagem')
  const modalidade = watch('modalidade')

  useEffect(() => {
    async function load() {
      if (user?.role === 'admin_clinica' && clinic?.id) {
        const profs = await pb.collection('clinic_professionals').getFullList({
          filter: `clinic = '${clinic.id}' && is_active = true`,
          expand: 'professional',
        })
        setProfissionais(profs.map((p) => p.expand?.professional).filter(Boolean))
      }

      if (id) {
        const g = await getGrupo(id)
        Object.keys(g).forEach((k) => {
          if (k in schema.shape) {
            setValue(k as any, g[k])
          }
        })
        if (g.data_inicio) setValue('data_inicio', g.data_inicio.split('T')[0])
        if (g.data_fim) setValue('data_fim', g.data_fim.split('T')[0])
      } else {
        if (user?.role !== 'admin_clinica') {
          setValue('psicologo_responsavel', user.id)
        }
      }
    }
    load()
  }, [id, user, clinic])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const payload: any = { ...data }
      payload.clinica_id = clinic?.id || null
      if (user?.role !== 'admin_clinica' && !payload.psicologo_responsavel) {
        payload.psicologo_responsavel = user.id
      }
      if (!id) {
        payload.vagas_disponiveis = data.vagas_total
      }

      if (id) {
        await updateGrupo(id, payload)
        toast({ title: 'Sucesso', description: 'Grupo atualizado!' })
      } else {
        await createGrupo(payload)
        toast({ title: 'Sucesso', description: 'Grupo criado!' })
      }
      navigate('/grupos')
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{id ? 'Editar Grupo' : 'Novo Grupo'}</h1>
      </div>
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nome do Grupo" {...register('nome')} error={errors.nome?.message} />

            {user?.role === 'admin_clinica' && (
              <Select
                label="Psicólogo Responsável"
                {...register('psicologo_responsavel')}
                error={errors.psicologo_responsavel?.message}
                options={[
                  { label: 'Selecione', value: '' },
                  ...profissionais.map((p) => ({ label: p.name, value: p.id })),
                ]}
              />
            )}

            <Select
              label="Tipo de Grupo"
              {...register('tipo_grupo')}
              error={errors.tipo_grupo?.message}
              options={[
                { label: 'Psicoterapêutico', value: 'psicoterapeutico' },
                { label: 'Apoio', value: 'apoio' },
                { label: 'Psicoeducativo', value: 'psicoeducativo' },
                { label: 'Institucional', value: 'institucional' },
              ]}
            />

            {tipo_grupo === 'psicoterapeutico' && (
              <Select
                label="Abordagem"
                {...register('abordagem')}
                error={errors.abordagem?.message}
                options={[
                  { label: 'Selecione', value: '' },
                  { label: 'Psicanálise', value: 'psicanalise' },
                  { label: 'TCC', value: 'tcc' },
                  { label: 'Psicodrama', value: 'psicodrama' },
                  { label: 'Gestalt', value: 'gestalt' },
                  { label: 'Humanista', value: 'humanista' },
                  { label: 'Outra', value: 'outra' },
                ]}
              />
            )}

            {abordagem === 'outra' && (
              <Input
                label="Especifique a Abordagem"
                {...register('abordagem_outra')}
                error={errors.abordagem_outra?.message}
              />
            )}

            <Select
              label="Modalidade"
              {...register('modalidade')}
              error={errors.modalidade?.message}
              options={[
                { label: 'Aberto', value: 'aberto' },
                { label: 'Fechado', value: 'fechado' },
              ]}
            />

            {modalidade === 'fechado' && (
              <>
                <Input
                  type="date"
                  label="Data de Início"
                  {...register('data_inicio')}
                  error={errors.data_inicio?.message}
                />
                <Input
                  type="date"
                  label="Data de Fim"
                  {...register('data_fim')}
                  error={errors.data_fim?.message}
                />
              </>
            )}

            <Input
              type="number"
              label="Total de Vagas"
              {...register('vagas_total')}
              error={errors.vagas_total?.message}
            />

            <Select
              label="Status"
              {...register('status')}
              error={errors.status?.message}
              options={[
                { label: 'Ativo', value: 'ativo' },
                { label: 'Inativo', value: 'inativo' },
                { label: 'Encerrado', value: 'encerrado' },
              ]}
            />

            <Select
              label="Recorrência"
              {...register('recorrencia')}
              error={errors.recorrencia?.message}
              options={[
                { label: 'Semanal', value: 'semanal' },
                { label: 'Quinzenal', value: 'quinzenal' },
                { label: 'Mensal', value: 'mensal' },
              ]}
            />

            <Select
              label="Dia da Semana"
              {...register('dia_semana')}
              error={errors.dia_semana?.message}
              options={[
                { label: 'Segunda-feira', value: 'segunda' },
                { label: 'Terça-feira', value: 'terca' },
                { label: 'Quarta-feira', value: 'quarta' },
                { label: 'Quinta-feira', value: 'quinta' },
                { label: 'Sexta-feira', value: 'sexta' },
                { label: 'Sábado', value: 'sabado' },
                { label: 'Domingo', value: 'domingo' },
              ]}
            />

            <Input
              type="time"
              label="Horário"
              {...register('horario')}
              error={errors.horario?.message}
            />
            <Input
              type="number"
              label="Duração (minutos)"
              {...register('duracao_minutos')}
              error={errors.duracao_minutos?.message}
            />
            <Input label="Sala / Link" {...register('sala')} error={errors.sala?.message} />
            <Input
              type="number"
              step="0.01"
              label="Valor Mensalidade (R$)"
              {...register('valor_mensalidade')}
              error={errors.valor_mensalidade?.message}
            />
          </div>

          <Input
            label="Público Alvo"
            {...register('publico_alvo')}
            error={errors.publico_alvo?.message}
          />
          <Textarea
            label="Descrição"
            {...register('descricao')}
            error={errors.descricao?.message}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => navigate('/grupos')}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Salvar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
