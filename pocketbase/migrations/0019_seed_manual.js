migrate(
  (app) => {
    const manual = app.findCollectionByNameOrId('system_manual')
    const items = [
      {
        title: 'Como cadastrar um paciente?',
        content:
          "Vá para a tela de Pacientes no menu lateral e clique no botão 'Novo Paciente'. Preencha os dados e salve.",
        type: 'faq',
        sort_order: 1,
      },
      {
        title: 'Como agendar uma sessão recorrente?',
        content:
          "Na Agenda, clique em 'Nova Sessão' e marque a opção 'Recorrente', escolhendo a frequência e a quantidade de repetições.",
        type: 'faq',
        sort_order: 2,
      },
      {
        title: 'Como emitir um recibo?',
        content:
          "Acesse o módulo Financeiro, localize o registro de pagamento já efetivado e clique em 'Emitir Recibo'. O PDF será gerado instantaneamente.",
        type: 'faq',
        sort_order: 3,
      },
      {
        title: 'Como convidar outro psicólogo para a clínica?',
        content:
          "No menu Gestão de Clínica, vá na aba Profissionais e clique em 'Convidar'. Defina as permissões e o modelo de repasse financeiro.",
        type: 'faq',
        sort_order: 4,
      },
      {
        title: 'Como configurar notificações?',
        content:
          "Acesse 'Configurações' no menu lateral e navegue até a aba 'Notificações'. Lá você pode ativar envios por e-mail e in-app.",
        type: 'faq',
        sort_order: 5,
      },
      {
        title: 'O que fazer se o paciente não confirmar a sessão?',
        content:
          "Você pode reagendar a sessão contatando o paciente ou marcá-la com o status 'Falta' na Agenda, o que entrará nas estatísticas de No-Show.",
        type: 'faq',
        sort_order: 6,
      },
      {
        title: 'Como gerar relatórios?',
        content:
          'Vá ao módulo de Relatórios (ícone de gráfico), escolha o tipo de relatório (Clínico, Financeiro, Produtividade) e selecione o período para exportação.',
        type: 'faq',
        sort_order: 7,
      },
      {
        title: 'O que é o módulo Crise e Segurança?',
        content:
          'É um módulo inteligente do Syntra que detecta sinais de risco (ex: idealização suicida) nos diários dos pacientes e envia alertas imediatos para você intervir.',
        type: 'faq',
        sort_order: 8,
      },

      {
        title: 'Banco de Horas',
        content:
          'Controle de horas acumuladas para profissionais parceiros ou secretárias, visível na Gestão de Clínica.',
        type: 'glossary',
        sort_order: 1,
      },
      {
        title: 'Comissionamento',
        content:
          'Porcentagem acordada do valor da sessão que é repassada ao profissional parceiro em vez de ficar com a clínica.',
        type: 'glossary',
        sort_order: 2,
      },
      {
        title: 'Evolução',
        content:
          'Registro clínico detalhado e assinado digitalmente sobre os desdobramentos de uma sessão.',
        type: 'glossary',
        sort_order: 3,
      },
      {
        title: 'No-Show',
        content:
          'Métrica que indica quando o paciente não comparece à sessão sem realizar aviso prévio.',
        type: 'glossary',
        sort_order: 4,
      },
      {
        title: 'Prontuário',
        content:
          'Conjunto de documentos eletrônicos com o histórico clínico do paciente, evoluções e uploads de exames.',
        type: 'glossary',
        sort_order: 5,
      },
      {
        title: 'Recorrência',
        content:
          'Configuração de sessões na agenda que se repetem automaticamente em dias e horários padronizados.',
        type: 'glossary',
        sort_order: 6,
      },
      {
        title: 'Tag',
        content:
          'Etiqueta visual e flexível usada para classificar pacientes ou destacar características importantes em evoluções.',
        type: 'glossary',
        sort_order: 7,
      },

      {
        title: '1. Visão Geral do Syntra',
        category: 'Iniciante',
        type: 'video',
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ?controls=0',
        video_duration: '02:15',
        sort_order: 1,
      },
      {
        title: '2. Cadastro de Pacientes',
        category: 'Iniciante',
        type: 'video',
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ?controls=0',
        video_duration: '03:40',
        sort_order: 2,
      },
      {
        title: '3. Dominando a Agenda',
        category: 'Iniciante',
        type: 'video',
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ?controls=0',
        video_duration: '05:10',
        sort_order: 3,
      },
    ]

    items.forEach((item) => {
      try {
        app.findFirstRecordByData('system_manual', 'title', item.title)
      } catch (_) {
        const record = new Record(manual)
        Object.entries(item).forEach(([k, v]) => record.set(k, v))
        app.save(record)
      }
    })
  },
  (app) => {},
)
