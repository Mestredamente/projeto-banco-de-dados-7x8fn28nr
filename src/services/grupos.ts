import pb from '@/lib/pocketbase/client'

export const getGrupos = (filter = '') =>
  pb
    .collection('grupos_terapeuticos')
    .getFullList({ filter, sort: '-created', expand: 'psicologo_responsavel,clinica_id' })

export const getGrupo = (id: string) =>
  pb.collection('grupos_terapeuticos').getOne(id, { expand: 'psicologo_responsavel,clinica_id' })

export const createGrupo = (data: any) => pb.collection('grupos_terapeuticos').create(data)

export const updateGrupo = (id: string, data: any) =>
  pb.collection('grupos_terapeuticos').update(id, data)

export const getParticipantes = (grupoId: string) =>
  pb
    .collection('participantes_grupo')
    .getFullList({ filter: `grupo_id = '${grupoId}'`, expand: 'paciente_id', sort: '-created' })

export const addParticipante = (data: any) => pb.collection('participantes_grupo').create(data)

export const updateParticipante = (id: string, data: any) =>
  pb.collection('participantes_grupo').update(id, data)

export const getSessoes = (grupoId: string) =>
  pb.collection('sessoes_grupo').getFullList({ filter: `grupo_id = '${grupoId}'`, sort: '-data' })

export const createSessao = (data: any) => pb.collection('sessoes_grupo').create(data)

export const updateSessao = (id: string, data: any) =>
  pb.collection('sessoes_grupo').update(id, data)

export const getPresencas = (sessaoId: string) =>
  pb
    .collection('presenca_grupo')
    .getFullList({ filter: `sessao_id = '${sessaoId}'`, expand: 'participante_id.paciente_id' })

export const updatePresenca = (id: string, data: any) =>
  pb.collection('presenca_grupo').update(id, data)

export const getEvolucoes = (grupoId: string, tipo?: string) => {
  let filter = `grupo_id = '${grupoId}'`
  if (tipo) filter += ` && tipo = '${tipo}'`
  return pb.collection('evolucoes_grupo').getFullList({
    filter,
    sort: '-created',
    expand: 'autor_id,participante_id.paciente_id,sessao_id',
  })
}

export const createEvolucao = (data: any) => pb.collection('evolucoes_grupo').create(data)

export const deleteEvolucao = (id: string) => pb.collection('evolucoes_grupo').delete(id)
