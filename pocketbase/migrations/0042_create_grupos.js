migrate(
  (app) => {
    const grupos = new Collection({
      name: 'grupos_terapeuticos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        {
          name: 'psicologo_responsavel',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'clinica_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('clinics').id,
          maxSelect: 1,
        },
        {
          name: 'tipo_grupo',
          type: 'select',
          values: ['psicoterapeutico', 'apoio', 'psicoeducativo', 'institucional'],
          required: true,
        },
        {
          name: 'abordagem',
          type: 'select',
          values: ['psicanalise', 'tcc', 'psicodrama', 'gestalt', 'humanista', 'outra'],
        },
        { name: 'abordagem_outra', type: 'text' },
        { name: 'modalidade', type: 'select', values: ['aberto', 'fechado'], required: true },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_fim', type: 'date' },
        { name: 'vagas_total', type: 'number' },
        { name: 'vagas_disponiveis', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['ativo', 'inativo', 'encerrado'],
          required: true,
        },
        {
          name: 'recorrencia',
          type: 'select',
          values: ['semanal', 'quinzenal', 'mensal'],
          required: true,
        },
        {
          name: 'dia_semana',
          type: 'select',
          values: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
          required: true,
        },
        { name: 'horario', type: 'text' },
        { name: 'duracao_minutos', type: 'number' },
        { name: 'sala', type: 'text' },
        { name: 'publico_alvo', type: 'text' },
        { name: 'valor_mensalidade', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(grupos)

    const participantes = new Collection({
      name: 'participantes_grupo',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'grupo_id',
          type: 'relation',
          collectionId: grupos.id,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'paciente_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('patients').id,
          maxSelect: 1,
          required: true,
        },
        { name: 'data_entrada', type: 'date' },
        { name: 'data_saida', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['ativo', 'desligado', 'concluido'],
          required: true,
        },
        { name: 'motivo_desligamento', type: 'text' },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(participantes)

    const sessoes = new Collection({
      name: 'sessoes_grupo',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'grupo_id',
          type: 'relation',
          collectionId: grupos.id,
          maxSelect: 1,
          required: true,
        },
        { name: 'data', type: 'date', required: true },
        { name: 'horario_inicio', type: 'text' },
        { name: 'horario_fim', type: 'text' },
        { name: 'tema', type: 'text' },
        { name: 'descricao', type: 'text' },
        { name: 'sala', type: 'text' },
        { name: 'modalidade', type: 'select', values: ['presencial', 'online'] },
        {
          name: 'status',
          type: 'select',
          values: ['agendada', 'realizada', 'cancelada'],
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(sessoes)

    const presenca = new Collection({
      name: 'presenca_grupo',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'sessao_id',
          type: 'relation',
          collectionId: sessoes.id,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'participante_id',
          type: 'relation',
          collectionId: participantes.id,
          maxSelect: 1,
          required: true,
        },
        { name: 'presente', type: 'bool' },
        { name: 'justificativa', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(presenca)

    const evolucoes = new Collection({
      name: 'evolucoes_grupo',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'grupo_id',
          type: 'relation',
          collectionId: grupos.id,
          maxSelect: 1,
          required: true,
        },
        { name: 'sessao_id', type: 'relation', collectionId: sessoes.id, maxSelect: 1 },
        {
          name: 'autor_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          required: true,
        },
        {
          name: 'tipo',
          type: 'select',
          values: ['coletiva', 'individual_em_grupo'],
          required: true,
        },
        { name: 'participante_id', type: 'relation', collectionId: participantes.id, maxSelect: 1 },
        { name: 'conteudo', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(evolucoes)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('evolucoes_grupo'))
    app.delete(app.findCollectionByNameOrId('presenca_grupo'))
    app.delete(app.findCollectionByNameOrId('sessoes_grupo'))
    app.delete(app.findCollectionByNameOrId('participantes_grupo'))
    app.delete(app.findCollectionByNameOrId('grupos_terapeuticos'))
  },
)
