import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  User,
  Project,
  Task,
  DiarioEntry,
  TimeEntry,
  ChatMessage,
  Notification,
  AuditLog,
  CalendarEvent,
  Category,
  TaskPriority,
  TaskStatus,
  Role,
  Meeting,
  Pendencia,
  ChatChannel,
  KnowledgeDoc,
  Team
} from './src/types.js';

// Base seed data setup
let users: User[] = [
  { 
    id: 'u-1', 
    name: 'Ana Silva', 
    role: 'Analista', 
    email: 'ana.silva@britania.com.br', 
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 
    status: 'Online',
    active: true,
    reportsToUserId: 'u-3',
    permissions: { canEditSettings: true, canCreateProjects: true, canRegisterMeetings: true, canManageUsers: false }
  },
  { 
    id: 'u-2', 
    name: 'Pedro Souza', 
    role: 'Analista', 
    email: 'pedro.souza@britania.com.br', 
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 
    status: 'Ocupado',
    active: true,
    reportsToUserId: 'u-3',
    permissions: { canEditSettings: false, canCreateProjects: false, canRegisterMeetings: true, canManageUsers: false }
  },
  { 
    id: 'u-3', 
    name: 'Carlos Rodrigues', 
    role: 'Supervisor', 
    email: 'carlos.rodrigues@britania.com.br', 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 
    status: 'Online',
    active: true,
    reportsToUserId: 'u-4',
    permissions: { canEditSettings: true, canCreateProjects: true, canRegisterMeetings: true, canManageUsers: true }
  },
  { 
    id: 'u-4', 
    name: 'Mariana Britto', 
    role: 'Gestão', 
    email: 'mariana.britto@britania.com.br', 
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', 
    status: 'Online',
    active: true,
    permissions: { canEditSettings: true, canCreateProjects: true, canRegisterMeetings: true, canManageUsers: true }
  }
];

let projects: Project[] = [
  { 
    id: 'proj-1', 
    name: 'ERP Protheus', 
    description: 'Manutenção, implantação de melhorias e processos no ERP Protheus Britânia.', 
    color: '#3b82f6',
    objective: 'Otimizar o faturamento e a conciliação fiscal e de estoques do principal ERP da empresa.',
    goals: 'Garantir SLA de faturamento em 100%, resolver deadlocks de concorrência log operacional e reduzir tempo de queries pesadas em 40%.',
    dueDate: '2026-08-30',
    deliverables: 'Migração de trigger de faturamento, novos índices SQL, e-mail diário com telemetria fiscal.',
    assignees: ['u-1', 'u-2'],
    supervisors: ['u-3'],
    observers: ['u-4'],
    sector: 'TI Core Sistemas',
    tools: 'SQL Server, AdvPL, TLPP, Postman',
    priority: 'Crítica',
    status: 'Ativo',
    budget: 'R$ 80.000',
    risks: 'Impacto potencial no tempo de faturamento ativo em horário comercial.',
    dependencies: 'Liberação de banco de testes isolado de produção.',
    successIndicators: 'Fins de dia sem incidentes na mesa de faturamento da matriz.',
    createdAt: '2026-05-15T08:00:00Z'
  },
  { 
    id: 'proj-2', 
    name: 'SAC Integrado', 
    description: 'Integração técnica com os canais de atendimento ao cliente, e-commerce e portais.', 
    color: '#10b981',
    objective: 'Centralizar todos os canais de entrada de chamados e e-commerce em um barramento operacional ágil.',
    goals: 'Tolerância ao atraso de mensageria abaixo de 3 segundos e taxa de processamento de fila sem gargalos.',
    dueDate: '2026-09-15',
    deliverables: 'Serviço em node, webhook em tempo real e integração com hub de logística.',
    assignees: ['u-2'],
    supervisors: ['u-3'],
    observers: ['u-4'],
    sector: 'Canais Digitais',
    tools: 'Node.js, Redis, MongoDB, Docker',
    priority: 'Alta',
    status: 'Ativo',
    budget: 'R$ 45.000',
    risks: 'Gargalos de concorrência com APIs externas das transportadoras.',
    dependencies: 'Novas chaves de ambiente produtivo da equipe comercial.',
    successIndicators: 'Tempo de resposta médio do webhook abaixo de 500ms.',
    createdAt: '2026-05-18T09:00:00Z'
  },
  { 
    id: 'proj-3', 
    name: 'WMS Fábrica Joinville', 
    description: 'Acompanhamento operacional e monitoramento de expedição logística.', 
    color: '#f59e0b',
    objective: 'Redesenhar a esteira de controle de separação e expedição no CD Central.',
    goals: 'Aumentar a vazão de pallets conferidos em 15% e mitigar de erros de despacho físicos de caixas na esteira.',
    dueDate: '2026-07-20',
    deliverables: 'Software coletor RF Android atualizado, dashboard bento de esteira em tempo real.',
    assignees: ['u-1'],
    supervisors: ['u-3'],
    observers: ['u-4'],
    sector: 'Logística',
    tools: 'Android, Kotlin, SQL Server, RF',
    priority: 'Alta',
    status: 'Ativo',
    budget: 'R$ 90.000',
    risks: 'Interrupções físicas nas esteiras durante períodos de pico operacional.',
    dependencies: 'Disponibilidade de rede RF unificada nas linhas da fábrica.',
    successIndicators: 'Audit de erros físicos zerados nas remessas semanais.',
    createdAt: '2026-05-10T11:00:00Z'
  },
  { 
    id: 'proj-4', 
    name: 'PowerBI Operações', 
    description: 'Suporte a dashboards de indicadores executivos, metas e SLA operacional.', 
    color: '#8b5cf6',
    objective: 'Consolidar métricas gerais de SLAs e tempo de faturamento corporativo.',
    goals: 'Criar relatórios executivos em tempo real com agendamento de recarga a cada 30 minutos.',
    dueDate: '2026-06-30',
    deliverables: 'Painel bento visual, gateway com rotina estável e relatórios integrados.',
    assignees: ['u-1', 'u-2'],
    supervisors: ['u-4'],
    observers: ['u-3'],
    sector: 'BI & Analytics',
    tools: 'Power BI, DAX, Python, PostgreSQL',
    priority: 'Média',
    status: 'Ativo',
    budget: 'R$ 30.000',
    risks: 'Processamento excessivo de dados prejudicando concorrência de leitura.',
    dependencies: 'Redirecionamento de réplicas de leitura das bases SQL.',
    successIndicators: 'Recargas integradas concluídas sem downtime diário.',
    createdAt: '2026-05-20T10:00:00Z'
  }
];

// NOVAS ESTRUTURAS OPERACIONAIS
let meetings: Meeting[] = [
  {
    id: 'm-1',
    title: 'Alinhamento Semanal SAC & ERP',
    date: '2026-05-27',
    time: '14:00',
    objective: 'Sincronizar prazos da migração do SAC integrado com o ERP Protheus Britânia.',
    participants: ['u-1', 'u-2', 'u-3'],
    ataText: 'Definido o congelamento operacional de requisitos adicionais. A esteira de conciliação fiscal terá prioridade máxima no backlog. As APIs externas serão testadas em ambiente isolado antes do envio de dados.',
    decisions: 'Congelamento de escopo técnico aceito; desenvolvimento do trigger adiado para a fase 2; deploy experimental de mensageria nesta quinta.',
    pendingIssues: 'Criar tarefas de stress test e validação de triggers.',
    responsibles: ['u-1', 'u-2'],
    nextSteps: 'Configurar rotas de callback sob controle de segurança e autenticação robusta.',
    generateTasksAutomatically: true,
    projectId: 'proj-1',
    createdAt: '2026-05-27T15:00:00Z'
  }
];

let pendencias: Pendencia[] = [
  {
    id: 'p-1',
    title: 'Monitoramento SGBD - Thread de deadlock no faturamento',
    description: 'Erros esporádicos no encerramento de faturamento das filiais. Suspeita de isolamento inadequado em query de conciliação.',
    sectorResponsible: 'TI Core Sistemas',
    userResponsibleId: 'u-1',
    targetArea: 'Suporte Faturamento Matriz',
    status: 'Em Tratativa',
    dueDate: '2026-05-26', // Atrasada!
    projectId: 'proj-1',
    createdAt: '2026-05-24T10:00:00Z',
    history: [
      { date: '2026-05-24T10:00:00Z', content: 'Bloqueio de sessão detectado; e-mail de alerta operacional gerado automaticamente.', userId: 'u-3', userName: 'Carlos Rodrigues' },
      { date: '2026-05-25T14:30:00Z', content: 'Revisão dos índices da tabela SE1 concluído. Começando análise da concorrência de leitura em transações longas.', userId: 'u-1', userName: 'Ana Silva' }
    ]
  }
];

let chatChannels: ChatChannel[] = [
  { id: 'operacao', name: 'Operações Britânia', type: 'setor', sector: 'Operações', createdAt: '2026-05-20T00:00:00Z' },
  { id: 'supervisao', name: 'Supervisão Ativa', type: 'setor', sector: 'Supervisão', createdAt: '2026-05-20T00:00:00Z' },
  { id: 'proj-1', name: 'Canal: ERP Protheus', type: 'projeto', projectId: 'proj-1', createdAt: '2026-05-20T00:00:00Z' },
  { id: 'proj-2', name: 'Canal: SAC Integrado', type: 'projeto', projectId: 'proj-2', createdAt: '2026-05-20T00:00:00Z' },
  { id: 'proj-3', name: 'Canal: WMS Fábrica', type: 'projeto', projectId: 'proj-3', createdAt: '2026-05-20T00:00:00Z' },
  { id: 'proj-4', name: 'Canal: PowerBI', type: 'projeto', projectId: 'proj-4', createdAt: '2026-05-20T00:00:00Z' }
];

let knowledgeDocs: KnowledgeDoc[] = [
  {
    id: 'doc-1',
    title: 'Guia de Contingência - Banco de Dados ERP Protheus',
    category: 'Procedimentos',
    content: '### Rotina de Contingência para Deadlock de CPU\n\nEste documento guia o time de apoio durante episódios de sobrecarga técnica:\n\n1. Use a query `sp_whoIsActive` para isolar a thread causadora.\n2. Se houver travamento estrito por mais de 5 minutos na tabela de cabeçalho de notas (SF2), solicite liberação temporária via chat.\n3. Execute script de limpeza preventiva caso a sessão esteja órfã no servidor.',
    links: [{ label: 'Wiki Geral TI', url: 'https://wiki.britania.com.br/ti' }],
    createdAt: '2026-05-25T08:00:00Z',
    authorId: 'u-3'
  },
  {
    id: 'doc-2',
    title: 'Manual de Controle SLA de Despacho Logístico',
    category: 'Manuais',
    content: '### Regras Operativas do WMS Fábrica Joinville\n\n- O despacho de pedidos expedidos não deve superar 1h de atraso desde a emissão da nota de remessa.\n- Caso a esteira principal pare por falha eletrônica, os pacotes devem ser transferidos manualmente para a zona auxiliar B.\n- Relatórios diários automáticos são exportados às 18:30 no PowerBI principal.',
    links: [{ label: 'Painel SLA WMS', url: 'https://sla.joinville.com.br' }],
    createdAt: '2026-05-26T10:00:00Z',
    authorId: 'u-4'
  }
];

let teams: Team[] = [
  {
    id: 'team-1',
    name: 'Sistemas Core ERP',
    description: 'Equipe responsável pela sustentação, banco de dados, desenvolvimento ADVPL/SQL e conciliações fiscais do ERP Britânia.',
    sector: 'TI Desenvolvimentos',
    leaderId: 'u-3',
    memberIds: ['u-1', 'u-2'],
    tags: ['ERP', 'SQL Server', 'AdvPL', 'Faturamento'],
    createdAt: '2026-05-20T00:00:00Z'
  },
  {
    id: 'team-2',
    name: 'Operação Sistemas Logística',
    description: 'Esquadra especializada no monitoramento, SLA e suporte do ambiente WMS Joinville.',
    sector: 'Operações Logísticas',
    leaderId: 'u-4',
    memberIds: ['u-1'],
    tags: ['WMS', 'Android Coletor', 'Fábrica'],
    createdAt: '2026-05-22T00:00:00Z'
  }
];

let tasks: Task[] = [
  {
    id: 't-1',
    title: 'Ajuste de query crítica no faturamento',
    description: 'A query de consolidação de faturamento diário está apresentando lentidão na base Protheus. Necessário revisar indexação.',
    status: 'Em Andamento',
    priority: 'Crítica',
    projectId: 'proj-1',
    assignees: ['u-1'],
    subtasks: [
      { id: 's-1-1', title: 'Análise do plano de execução SQL', completed: true },
      { id: 's-1-2', title: 'Criação do índice de teste', completed: false },
      { id: 's-1-3', title: 'Deploy e validação operacional', completed: false }
    ],
    dueDate: '2026-05-29',
    tags: ['Proc', 'SGBD', 'Urgente'],
    comments: [
      { id: 'c-1', userId: 'u-3', userName: 'Carlos Rodrigues', content: 'Ana, favor priorizar este ajuste. O faturamento de fechamento depende disso.', createdAt: '2026-05-27T10:15:30Z' }
    ],
    timeSpent: 7200,
    createdAt: '2026-05-26T08:00:00Z',
    updatedAt: '2026-05-27T14:30:00Z'
  },
  {
    id: 't-2',
    title: 'Migração API de Rastreamento SAC',
    description: 'Migração do endpoint legado para a nova API de transportadoras integradas, aumentando resiliência e velocidade de atualização.',
    status: 'A Fazer',
    priority: 'Alta',
    projectId: 'proj-2',
    assignees: ['u-2'],
    subtasks: [
      { id: 's-2-1', title: 'Mapeamento das propriedades JSON', completed: false },
      { id: 's-2-2', title: 'Criação do wrapper de tratamento de erros', completed: false }
    ],
    dueDate: '2026-06-02',
    tags: ['SAC', 'API', 'Logística'],
    comments: [],
    timeSpent: 0,
    createdAt: '2026-05-27T09:00:00Z',
    updatedAt: '2026-05-27T09:00:00Z'
  },
  {
    id: 't-3',
    title: 'Relatório Semanal de SLA WMS',
    description: 'Extração e polimento dos tempos operacionais de separação no WMS Joinville para reunião de diretoria.',
    status: 'Concluído',
    priority: 'Média',
    projectId: 'proj-3',
    assignees: ['u-1', 'u-2'],
    subtasks: [
      { id: 's-3-1', title: 'Extrair logs do banco WMS', completed: true },
      { id: 's-3-2', title: 'Processar dados e formatar no Excel', completed: true }
    ],
    dueDate: '2026-05-27',
    tags: ['SLA', 'WMS', 'Fábrica'],
    comments: [
      { id: 'c-2', userId: 'u-4', userName: 'Mariana Britto', content: 'Excelente trabalho na consolidação destes dados. Muito organizados.', createdAt: '2026-05-27T16:00:00Z' }
    ],
    timeSpent: 14400,
    createdAt: '2026-05-25T14:00:00Z',
    updatedAt: '2026-05-27T15:45:00Z'
  },
  {
    id: 't-4',
    title: 'Instabilidade do Servidor de Banco Linha 2',
    description: 'Servidor apresentou 3 episódios de lentidão extrema com reinício forçado dos Workers na fábrica Joinville.',
    status: 'Em Revisão',
    priority: 'Alta',
    projectId: 'proj-3',
    assignees: ['u-1'],
    subtasks: [
      { id: 's-4-1', title: 'Analise dump de memória heap', completed: true },
      { id: 's-4-2', title: 'Verificar logs do coletor de lixo', completed: true },
      { id: 's-4-3', title: 'Aumentar limite de conexões no pool', completed: true }
    ],
    dueDate: '2026-05-28',
    tags: ['Infra', 'Crítico'],
    comments: [],
    timeSpent: 9000,
    createdAt: '2026-05-26T16:20:00Z',
    updatedAt: '2026-05-27T11:00:00Z'
  },
  {
    id: 't-5',
    title: 'Homologação do Dashboard PowerBI Vendas',
    description: 'Reunião de alinhamento com a área comercial para homologar volumetria de vendas por canal.',
    status: 'Backlog',
    priority: 'Média',
    projectId: 'proj-4',
    assignees: ['u-2'],
    subtasks: [],
    dueDate: '2026-06-05',
    tags: ['PBI', 'Comercial'],
    comments: [],
    timeSpent: 0,
    createdAt: '2026-05-27T11:15:00Z',
    updatedAt: '2026-05-27T11:15:00Z'
  }
];

// Normalize task status structure
tasks.forEach(t => {
  if (t.status === ('Completado' as any)) {
    t.status = 'Concluído';
  }
});

let diaries: DiarioEntry[] = [
  {
    id: 'dlog-1',
    date: '2026-05-26',
    createdAt: '2026-05-26T18:30:00Z',
    userId: 'u-1',
    userName: 'Ana Silva',
    userRole: 'Analista',
    projectId: 'proj-1',
    projectName: 'ERP Protheus',
    category: 'Desenvolvimento',
    performedText: 'Criado novos índices na tabela de pedidos do Protheus e reescrita de subqueries com JOIN na extração de relatórios.',
    problemsText: 'Falta de acesso temporário a um dos servidores homologados devido à manutenção de segurança trimestral.',
    completedDemands: 'O faturamento de testes apresentou melhora de 40% na velocidade de processamento.',
    observations: 'A alteração está em staging e aguarda supervisão técnica para subir para produção.',
    status: 'Estável',
    pendingText: 'Validação final de conciliação financeira do ERP.',
    nextSteps: 'Aplicar correções nos pacotes remanescentes e documentar no Confluence.',
    timeSpentSeconds: 18000,
    tags: ['Protheus', 'Performance', 'SQL']
  },
  {
    id: 'dlog-2',
    date: '2026-05-26',
    createdAt: '2026-05-26T17:45:00Z',
    userId: 'u-2',
    userName: 'Pedro Souza',
    userRole: 'Analista',
    projectId: 'proj-2',
    projectName: 'SAC Integrado',
    category: 'Suporte(Chamado)',
    performedText: 'Atendimento a chamados críticos de integração com a transportadora Jadlog que causavam atraso na geração de etiquetas de postagem.',
    problemsText: 'API externa apresentou timeout frequente por volta das 14:00 às 15:30 operacionais.',
    completedDemands: 'Foram liberados 450 pacotes acumulados via script manual temporário.',
    observations: 'Notificado gestor operacional da Jadlog para alinhamento sobre limites de taxa de requisições (rate limiting).',
    status: 'Alerta',
    pendingText: 'Aguardando validação estável da esteira automática.',
    nextSteps: 'Implementar fila de retentativas assincronizadas na aplicação interna.',
    timeSpentSeconds: 16200,
    tags: ['SAC', 'Jadlog', 'Timeout']
  },
  {
    id: 'dlog-3',
    date: '2026-05-27',
    createdAt: '2026-05-27T17:00:00Z',
    userId: 'u-1',
    userName: 'Ana Silva',
    userRole: 'Analista',
    projectId: 'proj-3',
    projectName: 'WMS Fábrica Joinville',
    category: 'Monitoramento',
    performedText: 'Análise de instabilidade nos coletores de dados do armazém. O pool de conexões do servidor local se esgotava com picos de separação.',
    problemsText: 'Lentidão física no Wi-Fi industrial do setor G4 da fábrica impactou a latência das chamadas.',
    completedDemands: 'Feito dump de memória do servidor e reinício com configuração otimizada de tamanho de pool de banco.',
    observations: 'Recomendado ao time de infra verificar sinal dos pontos de acesso do setor G4.',
    status: 'Atencioso',
    pendingText: 'Problema no Wi-Fi ainda persiste de forma oscilante.',
    nextSteps: 'Reunião com equipe de redes amanhã cedo.',
    timeSpentSeconds: 21600,
    tags: ['WMS', 'Joinville', 'Wi-Fi']
  }
];

let timeEntries: TimeEntry[] = [
  {
    id: 'te-1',
    userId: 'u-1',
    userName: 'Ana Silva',
    taskId: 't-1',
    taskTitle: 'Ajuste de query crítica no faturamento',
    projectId: 'proj-1',
    projectName: 'ERP Protheus',
    description: 'Análise de planos de execução de consulta lenta na tabela SD2',
    startTime: '2026-05-27T08:30:00Z',
    durationSeconds: 7200,
    pausedSeconds: 600,
    pauses: [{ start: '2026-05-27T09:30:00Z', end: '2026-05-27T09:40:00Z' }],
    isActive: false,
    isPaused: false
  },
  {
    id: 'te-active-pedro',
    userId: 'u-2',
    userName: 'Pedro Souza',
    taskId: 't-2',
    taskTitle: 'Migração API de Rastreamento SAC',
    projectId: 'proj-2',
    projectName: 'SAC Integrado',
    description: 'Trabalhando no mapeamento das propriedades JSON do novo parceiro de frete.',
    startTime: new Date(Date.now() - 3600 * 1000).toISOString(), // iniciado há 1 hora
    durationSeconds: 3600,
    pausedSeconds: 0,
    pauses: [],
    isActive: true,
    isPaused: false
  }
];

let chatMessages: ChatMessage[] = [
  {
    id: 'm-1',
    channel: 'operacao',
    userId: 'u-3',
    userName: 'Carlos Rodrigues',
    userRole: 'Supervisor',
    content: 'Olá pessoal! Sejam bem-vindos ao Diário de Bordo da equipe de Staff Britânia. Vamos centralizar nossos canais operacionais aqui.',
    createdAt: '2026-05-26T08:05:00Z'
  },
  {
    id: 'm-2',
    channel: 'operacao',
    userId: 'u-1',
    userName: 'Ana Silva',
    userRole: 'Analista',
    content: 'Sensacional, Carlos! Isso vai facilitar muito para registrarmos os problemas encontrados nas fábricas.',
    createdAt: '2026-05-26T08:10:00Z'
  },
  {
    id: 'm-3',
    channel: 'operacao',
    userId: 'u-2',
    userName: 'Pedro Souza',
    userRole: 'Analista',
    content: 'Show de bola, o sistema de cronômetro integrado é ótimo para controlarmos nosso tempo e gerarmos métricas precisas.',
    createdAt: '2026-05-26T08:15:00Z'
  },
  {
    id: 'm-4',
    channel: 'avisos',
    userId: 'u-4',
    userName: 'Mariana Britto',
    userRole: 'Gestão',
    content: 'Atenção time: Reunião geral de fechamento operacional de maio amanhã às 14:00. O calendário operacional já foi atualizado!',
    createdAt: '2026-05-27T09:00:00Z'
  },
  {
    id: 'm-5',
    channel: 'operacao',
    userId: 'u-3',
    userName: 'Carlos Rodrigues',
    userRole: 'Supervisor',
    content: 'Entendido Mariana. Pessoal da operação, favor garantir que os Diários de Bordo estejam preenchidos antes da reunião para podermos rodar os relatórios automáticos pelo sistema.',
    createdAt: '2026-05-27T09:12:00Z'
  },
  {
    id: 'm-6',
    channel: 'suporte',
    userId: 'u-2',
    userName: 'Pedro Souza',
    userRole: 'Analista',
    content: 'Alguém mais está percebendo oscilação no acesso ao ambiente de homologação? Parece que o proxy corporativo está lentificando chamadas.',
    createdAt: '2026-05-27T10:45:00Z'
  },
  {
    id: 'm-7',
    channel: 'suporte',
    userId: 'u-1',
    userName: 'Ana Silva',
    userRole: 'Analista',
    content: 'Aqui também está assim, Pedro. Tive que desativar temporariamente o proxy local e apontar para as máquinas das fábricas direto.',
    createdAt: '2026-05-27T11:00:00Z'
  }
];

let notifications: Notification[] = [
  {
    id: 'n-1',
    userId: 'u-1',
    title: 'Nova Tarefa Atribuída',
    content: 'Carlos Rodrigues atribuiu a você a tarefa: Ajuste de query crítica no faturamento.',
    read: false,
    createdAt: '2026-05-26T08:02:00Z',
    type: 'success'
  },
  {
    id: 'n-2',
    userId: 'u-1',
    title: 'Menção no Canal',
    content: 'Carlos Rodrigues marcou você no canal #operação.',
    read: false,
    createdAt: '2026-05-27T09:13:00Z',
    type: 'info'
  },
  {
    id: 'n-3',
    userId: 'u-2',
    title: 'Entrega Próxima',
    content: 'A tarefa "Migração API de Rastreamento SAC" vence em 5 dias.',
    read: true,
    createdAt: '2026-05-27T08:00:00Z',
    type: 'warning'
  }
];

let auditLogs: AuditLog[] = [
  {
    id: 'log-1',
    userId: 'u-3',
    userName: 'Carlos Rodrigues',
    userRole: 'Supervisor',
    action: 'Criação de Tarefa',
    targetType: 'Task',
    targetId: 't-1',
    details: 'Criou card de faturamento Protheus e atribuiu à Ana Silva.',
    createdAt: '2026-05-26T08:01:00Z'
  },
  {
    id: 'log-2',
    userId: 'u-1',
    userName: 'Ana Silva',
    userRole: 'Analista',
    action: 'Início de Atividade',
    targetType: 'Timer',
    targetId: 'te-1',
    details: 'Iniciou cronômetro interno para a tarefa t-1.',
    createdAt: '2026-05-27T08:30:00Z'
  },
  {
    id: 'log-3',
    userId: 'u-1',
    userName: 'Ana Silva',
    userRole: 'Analista',
    action: 'Conclusão de Tarefa',
    targetType: 'Task',
    targetId: 't-3',
    details: 'Moveu a tarefa "Relatório Semanal de SLA WMS" para Concluído.',
    createdAt: '2026-05-27T15:45:00Z'
  },
  {
    id: 'log-4',
    userId: 'u-1',
    userName: 'Ana Silva',
    userRole: 'Analista',
    action: 'Criação de Diário',
    targetType: 'Diario',
    targetId: 'dlog-3',
    details: 'Gravou suas atividades do dia sobre os coletores de dados e Wi-Fi Joinville.',
    createdAt: '2026-05-27T17:00:00Z'
  }
];

let calendarEvents: CalendarEvent[] = [
  {
    id: 'cal-1',
    title: 'Reunião de Fechamento Operativo - Maio',
    description: 'Balanço mensal de SLAs, incidentes reportados, projetos de automação e revisão de diários.',
    start: '2026-05-28T14:00:00Z',
    end: '2026-05-28T15:30:00Z',
    category: 'Reunião',
    color: '#3b82f6'
  },
  {
    id: 'cal-2',
    title: 'Manutenção Planejada Switch Joinville',
    description: 'Manutenção física de roteadores pelo time central de redes. Pode durar até 1 hora no setor industrial.',
    start: '2026-05-29T23:00:00Z',
    end: '2026-05-30T01:00:00Z',
    category: 'Manutenção',
    color: '#ef4444'
  },
  {
    id: 'cal-3',
    title: 'Prazo Limite: Homologação Protheus',
    description: 'Data limite para validação operacional das notas fiscais recalculadas no ERP.',
    start: '2026-05-29T18:00:00Z',
    end: '2026-05-29T19:00:00Z',
    category: 'Prazo',
    color: '#f59e0b'
  }
];

// Helper to write audit logs
function addAuditLog(userId: string, action: string, targetType: string, targetId: string, details: string) {
  const user = users.find(u => u.id === userId);
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId,
    userName: user ? user.name : 'Sistema',
    userRole: user ? user.role : 'Gestão',
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString()
  };
  auditLogs.unshift(newLog);
}

// Helper to check for notifications
function pushNotification(userId: string, title: string, content: string, type: 'info' | 'warning' | 'success' | 'alert') {
  const newNotification: Notification = {
    id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId,
    title,
    content,
    read: false,
    createdAt: new Date().toISOString(),
    type
  };
  notifications.unshift(newNotification);
}

const systemNotifiedOverdue = new Set<string>();

function emitChannelEvent(channelId: string, type: string, payload: { message: string }) {
  const systemMsg: ChatMessage = {
    id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    channel: channelId || 'operacao',
    userId: 'u-bot',
    userName: 'Sistema Operacional',
    userRole: 'Supervisor',
    content: payload.message,
    createdAt: new Date().toISOString()
  };
  chatMessages.push(systemMsg);
}

const app = express();
const PORT = 3000;

app.use(express.json());

// API Endpoints
// Auth Simulator / Switching User
app.get('/api/users', (req, res) => {
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { name, role, email, avatar } = req.body;
  const newUser: User = {
    id: `u-${Date.now()}`,
    name,
    role,
    email,
    avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    status: 'Online'
  };
  users.push(newUser);
  addAuditLog('u-4', 'Criar Usuário', 'User', newUser.id, `Cadastrou o usuário ${name} como ${role}.`);
  res.status(201).json(newUser);
});

// Update user status
app.put('/api/users/:id/status', (req, res) => {
  const { status } = req.body;
  const user = users.find(u => u.id === req.params.id);
  if (user) {
    user.status = status;
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Projects
app.get('/api/projects', (req, res) => {
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const { 
    name, description, color, objective, goals, dueDate, deliverables,
    sector, tools, priority, status, budget, risks, dependencies,
    successIndicators, assignees, supervisors, observers
  } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-4';
  const newProj: Project = {
    id: `proj-${Date.now()}`,
    name,
    description,
    color: color || '#3b82f6',
    objective,
    goals,
    dueDate,
    deliverables,
    sector,
    tools,
    priority: priority || 'Média',
    status: status || 'Ativo',
    budget,
    risks,
    dependencies,
    successIndicators,
    assignees: assignees || [],
    supervisors: supervisors || [],
    observers: observers || []
  };
  projects.push(newProj);
  addAuditLog(userId, 'Criar Projeto', 'Project', newProj.id, `Inseriu novo projeto comercial: "${name}".`);
  res.status(201).json(newProj);
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] as string || 'u-4';
  const projIndex = projects.findIndex(p => p.id === id);
  if (projIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const updatedProj = {
    ...projects[projIndex],
    ...req.body
  };
  projects[projIndex] = updatedProj;
  addAuditLog(userId, 'Editar Projeto', 'Project', id, `Alterou atributos técnicos do projeto: "${updatedProj.name}".`);
  res.json(updatedProj);
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] as string || 'u-4';
  const projIndex = projects.findIndex(p => p.id === id);
  if (projIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }
  const deleted = projects[projIndex];
  projects.splice(projIndex, 1);
  addAuditLog(userId, 'Excluir Projeto', 'Project', id, `Removeu projeto: "${deleted.name}".`);
  res.json({ success: true });
});

// Tasks / Kanban
app.get('/api/tasks', (req, res) => {
  // Verificação periódica de tarefas vencidas
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date();
  tasks.forEach(task => {
    if (task.status !== 'Concluído' && task.dueDate && task.dueDate < todayStr) {
      const due = new Date(task.dueDate);
      const timeDiff = today.getTime() - due.getTime();
      const diffDays = Math.max(1, Math.floor(timeDiff / (1000 * 3600 * 24)));
      const key = `${task.id}-${todayStr}`;
      if (!systemNotifiedOverdue.has(key)) {
        systemNotifiedOverdue.add(key);
        const projChan = task.linkedProjectId || task.projectId || 'operacao';
        emitChannelEvent(projChan, 'TASK_OVERDUE', {
          message: `⚠️ Tarefa "${task.title}" está vencida há ${diffDays}d.`
        });
      }
    }
  });
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { title, description, priority, projectId, assignees, subtasks, dueDate, tags } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-3';
  const newTask: Task = {
    id: `t-${Date.now()}`,
    title,
    description: description || '',
    status: 'Backlog',
    priority: priority || 'Média',
    projectId: projectId || 'proj-1',
    assignees: assignees || [],
    subtasks: (subtasks || []).map((s: any, idx: number) => ({ id: `s-${Date.now()}-${idx}`, title: s, completed: false })),
    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: tags || [],
    comments: [],
    timeSpent: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  tasks.push(newTask);
  addAuditLog(userId, 'Criar Tarefa', 'Task', newTask.id, `Criou a tarefa "${title}" no Kanban.`);
  
  // Notify assignees
  newTask.assignees.forEach(assigneeId => {
    pushNotification(assigneeId, 'Nova Tarefa Atribuída', `Você foi designado para a tarefa: ${title}.`, 'success');
  });

  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const task = tasks.find(t => t.id === taskId);
  const userId = req.headers['x-user-id'] as string || 'u-1';

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const oldStatus = task.status;
  const { status, priority, title, description, projectId, assignees, dueDate, tags, timeSpent, observers, demandType, linkedProjectId, linkedDemandId, linkedEventId, linkedMeetingId, linkedPendenciaId, linkedDiarioId, history, attachments, subtasks } = req.body;

  const userObj = users.find(u => u.id === userId);
  const channelId = task.projectId || projectId || 'operacao';

  if (status && status !== oldStatus) {
    task.status = status;
    addAuditLog(userId, 'Mover Tarefa', 'Task', task.id, `Moveu de "${oldStatus}" para "${status}".`);
    
    // Notify creator or other supervisors sometimes
    if (status === 'Concluído') {
      pushNotification('u-3', 'Tarefa Concluída', `${userObj?.name || 'Um analista'} completou a tarefa: ${task.title}`, 'success');
      
      const projChan = task.linkedProjectId || task.projectId || 'operacao';
      emitChannelEvent(projChan, 'TASK_COMPLETED', {
        message: `✅ Tarefa "${task.title}" concluída por ${userObj?.name || 'Sistema'}.`
      });
    }

    // Dynamic automatic message inside chat channels
    const autoMsg: ChatMessage = {
      id: `auto-status-${Date.now()}`,
      channel: channelId,
      userId: 'u-bot',
      userName: 'Gerenciador Operacional (IA)',
      userRole: 'Supervisor',
      content: `🔄 **Alteração de Status**: A tarefa "${task.title}" foi movida para **${status}** por **${userObj?.name || 'Staff'}**.`,
      createdAt: new Date().toISOString()
    };
    chatMessages.push(autoMsg);
  }

  if (priority) task.priority = priority;
  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (projectId) task.projectId = projectId;
  if (assignees) {
    // Audit assignment differences
    const added = assignees.filter((x: string) => !task.assignees.includes(x));
    added.forEach((aId: string) => {
      pushNotification(aId, 'Atribuído em Tarefa', `Você foi adicionado à tarefa: " ${task.title} "`, 'info');
    });
    task.assignees = assignees;

    const nomes = assignees.map((id: string) => users.find(u => u.id === id)?.name || 'Anônimo').join(', ');
    const projChan = task.linkedProjectId || task.projectId || 'operacao';
    emitChannelEvent(projChan, 'TASK_ASSIGNEES_CHANGED', {
      message: `👤 Responsáveis atualizados: agora ${nomes}.`
    });

    // Chat alerting responsibles change
    const autoMsg: ChatMessage = {
      id: `auto-assign-${Date.now()}`,
      channel: channelId,
      userId: 'u-bot',
      userName: 'Gerenciador Operacional (IA)',
      userRole: 'Supervisor',
      content: `👥 **Alocação de Equipe**: A tarefa "${task.title}" está sob responsabilidade de: **${nomes}**.`,
      createdAt: new Date().toISOString()
    };
    chatMessages.push(autoMsg);
  }
  if (observers !== undefined) task.observers = observers;
  if (demandType !== undefined) task.demandType = demandType;
  if (dueDate) task.dueDate = dueDate;
  if (tags) task.tags = tags;
  if (timeSpent !== undefined) task.timeSpent = timeSpent;
  if (history !== undefined) task.history = history;
  if (attachments !== undefined) task.attachments = attachments;
  if (subtasks !== undefined) task.subtasks = subtasks;
  
  // Vínculos avançados
  if (linkedProjectId !== undefined) task.linkedProjectId = linkedProjectId;
  if (linkedDemandId !== undefined) task.linkedDemandId = linkedDemandId;
  if (linkedEventId !== undefined) task.linkedEventId = linkedEventId;
  if (linkedMeetingId !== undefined) task.linkedMeetingId = linkedMeetingId;
  if (linkedPendenciaId !== undefined) task.linkedPendenciaId = linkedPendenciaId;
  if (linkedDiarioId !== undefined) task.linkedDiarioId = linkedDiarioId;

  task.updatedAt = new Date().toISOString();
  res.json(task);
});

// Post comment
app.post('/api/tasks/:id/comments', (req, res) => {
  const taskId = req.params.id;
  const { content } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-1';
  const user = users.find(u => u.id === userId);

  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const comment = {
    id: `comment-${Date.now()}`,
    userId,
    userName: user ? user.name : 'Time Britânia',
    content,
    createdAt: new Date().toISOString()
  };

  task.comments.push(comment);
  addAuditLog(userId, 'Comentário', 'Task', task.id, `Comentou na tarefa: "${task.title}".`);

  // Notify other assignees on this card
  task.assignees.forEach(aId => {
    if (aId !== userId) {
      pushNotification(aId, 'Novo Comentário', `${user?.name || 'Colega'} comentou em "${task.title}".`, 'info');
    }
  });

  res.status(201).json(comment);
});

// Toggle subtask
app.post('/api/tasks/:id/subtasks/toggle', (req, res) => {
  const taskId = req.params.id;
  const { subtaskId } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-1';

  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const subtask = task.subtasks.find(s => s.id === subtaskId);
  if (!subtask) {
    return res.status(404).json({ error: 'Subtask not found' });
  }

  subtask.completed = !subtask.completed;
  task.updatedAt = new Date().toISOString();

  addAuditLog(userId, 'Subtask Atualizada', 'Task', task.id, `${subtask.completed ? 'Marcou' : 'Desmarcou'} "${subtask.title}" como efetuado.`);

  res.json(task);
});

// Create subtask
app.post('/api/tasks/:id/subtasks', (req, res) => {
  const taskId = req.params.id;
  const { title } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-1';

  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const newSub: any = {
    id: `s-${Date.now()}`,
    title,
    completed: false
  };

  task.subtasks.push(newSub);
  task.updatedAt = new Date().toISOString();

  addAuditLog(userId, 'Criar Subtask', 'Task', task.id, `Adicionou sub-requisito "${title}" na tarefa.`);
  res.status(201).json(newSub);
});

// Diários de Bordo
app.get('/api/diaries', (req, res) => {
  res.json(diaries);
});

app.post('/api/diaries', (req, res) => {
  const {
    date,
    projectId,
    category,
    performedText,
    problemsText,
    completedDemands,
    observations,
    status,
    pendingText,
    nextSteps,
    timeSpentSeconds,
    tags
  } = req.body;

  const userId = req.headers['x-user-id'] as string || 'u-1';
  const user = users.find(u => u.id === userId);

  const project = projects.find(p => p.id === projectId) || projects[0];

  const newDiary: DiarioEntry = {
    id: `dlog-${Date.now()}`,
    date: date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    userId,
    userName: user ? user.name : 'Analista',
    userRole: user ? user.role : 'Analista',
    projectId,
    projectName: project.name,
    category: category || 'Desenvolvimento',
    performedText: performedText || '',
    problemsText: problemsText || '',
    completedDemands: completedDemands || '',
    observations: observations || '',
    status: status || 'Estável',
    pendingText: pendingText || '',
    nextSteps: nextSteps || '',
    timeSpentSeconds: Number(timeSpentSeconds) || 0,
    tags: tags || []
  };

  diaries.unshift(newDiary);
  addAuditLog(userId, 'Cadastrar Diário', 'Diario', newDiary.id, `Preencheu diário de bordo sobre o projeto ${project.name}.`);

  // Notify supervisors/manger
  users.filter(u => u.role !== 'Analista').forEach(u => {
    pushNotification(u.id, 'Novo Diário Registrado', `${user?.name || 'Analista'} registrou atividades de bordo sobre "${project.name}".`, 'info');
  });

  res.status(201).json(newDiary);
});

// ===================================
// PLATFORM OPERATIONS FOR NEW FEATS
// ===================================

// Meetings CRUD
app.get('/api/meetings', (req, res) => {
  res.json(meetings);
});

app.post('/api/meetings', (req, res) => {
  const { title, date, time, objective, participants, ataText, decisions, pendingIssues, responsibles, nextSteps, generateTasksAutomatically, projectId } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-3';

  const newMeeting: Meeting = {
    id: `meet-${Date.now()}`,
    title: title || 'Reunião Operacional',
    date: date || new Date().toISOString().split('T')[0],
    time: time || '10:00',
    objective: objective || '',
    participants: participants || [],
    ataText: ataText || '',
    decisions: decisions || '',
    pendingIssues: pendingIssues || '',
    responsibles: responsibles || [],
    nextSteps: nextSteps || '',
    generateTasksAutomatically: !!generateTasksAutomatically,
    projectId,
    createdAt: new Date().toISOString()
  };

  meetings.unshift(newMeeting);
  addAuditLog(userId, 'Cadastrar Reunião', 'Meeting', newMeeting.id, `Registrou ata da reunião "${newMeeting.title}" do dia ${newMeeting.date}.`);

  // Emit chat helper notification
  emitChannelEvent(projectId || 'operacao', 'MEETING_CREATED', {
    message: `📅 Reunião marcada: ${newMeeting.title} em ${newMeeting.date} ${newMeeting.time}.`
  });

  const mChannel = projectId || 'operacao';
  chatMessages.push({
    id: `auto-meet-${Date.now()}`,
    channel: mChannel,
    userId: 'u-bot',
    userName: 'Gerenciador Operacional (IA)',
    userRole: 'Supervisor',
    content: `📅 **Nova Reunião Registrada**: A reunião de pauta "${newMeeting.title}" foi agendada para o dia **${newMeeting.date}** às **${newMeeting.time}h**. Objetivo de trabalho: *${newMeeting.objective || 'Alinhamento geral'}*.`,
    createdAt: new Date().toISOString()
  });

  // Auto-generate task if flag is true
  if (newMeeting.generateTasksAutomatically) {
    const items: string[] = [];
    if (newMeeting.pendingIssues) {
      newMeeting.pendingIssues.split('\n').map(x => x.trim()).filter(x => x.length > 0).forEach(x => items.push(x));
    }
    if (newMeeting.nextSteps) {
      newMeeting.nextSteps.split('\n').map(x => x.trim()).filter(x => x.length > 0).forEach(x => items.push(x));
    }

    if (items.length === 0 && newMeeting.title) {
      // Fallback if empty to create at least one task
      items.push(`Ações pós-reunião: ${newMeeting.title}`);
    }

    items.forEach((itemText, idx) => {
      const newTask: Task = {
        id: `t-${Date.now()}-${idx}`,
        title: itemText,
        description: `Tarefa gerada automaticamente a partir da reunião "${newMeeting.title}" do dia ${newMeeting.date}.`,
        status: 'A Fazer',
        priority: 'Média',
        projectId: projectId || 'proj-1',
        assignees: responsibles && responsibles.length > 0 ? responsibles : (participants && participants.length > 0 ? [participants[0]] : ['u-1']),
        subtasks: [],
        dueDate: new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0], // 5 dias
        tags: ['Reunião', 'Ação'],
        comments: [],
        timeSpent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        demandType: 'demanda',
        linkedMeetingId: newMeeting.id
      };
      tasks.unshift(newTask);
      addAuditLog('u-system', 'Gerar Tarefa Reunião', 'Task', newTask.id, `Tarefa "${itemText}" vinculada gerada automaticamente no Kanban via Ata.`);
      
      // Notify assignees in new tasks
      newTask.assignees.forEach(assigneeId => {
        pushNotification(assigneeId, 'Nova Tarefa Atribuída', `Você foi designado para a tarefa: ${itemText} (via Ata).`, 'success');
      });
    });

    // Auto post summary message in Chat Channel
    const pChannel = projectId || 'operacao';
    const channelMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      channel: pChannel,
      userId: 'u-bot',
      userName: 'Gerenciador de Ata (IA)',
      userRole: 'Supervisor',
      content: `📢 **Tarefas Geradas via Ata**: ${items.length} novas tarefas foram criadas automaticamente para os integrantes e vinculadas à ata de reunião "${newMeeting.title}".`,
      createdAt: new Date().toISOString()
    };
    chatMessages.push(channelMsg);
  }

  // Notify participants
  newMeeting.participants.forEach(pId => {
    pushNotification(pId, 'Participação em Reunião', `Ata de "${newMeeting.title}" registrada com sucesso. Acesse o Diário para ler.`, 'success');
  });

  res.status(201).json(newMeeting);
});

// Pendencias Tracker (Issue Queue) CRUD
app.get('/api/pendencias', (req, res) => {
  res.json(pendencias);
});

app.post('/api/pendencias', (req, res) => {
  const { title, description, sectorResponsible, userResponsibleId, targetArea, dueDate, projectId, taskId } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-1';
  const author = users.find(u => u.id === userId);

  const newP: Pendencia = {
    id: `pend-${Date.now()}`,
    title: title || 'Nova Pendência',
    description: description || '',
    sectorResponsible: sectorResponsible || 'TI Core Sistemas',
    userResponsibleId: userResponsibleId || 'u-1',
    targetArea: targetArea || 'Matriz',
    status: 'Pendente',
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    projectId,
    taskId,
    history: [
      { date: new Date().toISOString(), content: `Pendência registrada por ${author?.name || 'Staff'}.`, userId, userName: author?.name || 'Staff' }
    ]
  };

  pendencias.unshift(newP);
  addAuditLog(userId, 'Criar Pendência', 'Pendencia', newP.id, `Cadastrou pendência operacional de "${newP.title}". Setor: ${newP.sectorResponsible}.`);
  
  // Custom notification to responsible
  if (userResponsibleId) {
    pushNotification(userResponsibleId, 'Nova Pendência Vinculada', `Você foi designado para acompanhar e resolver a pendência "${newP.title}".`, 'warning');
  }

  // Auto notification on chat
  const pChannel = projectId || 'operacao';
  const chatAlert: ChatMessage = {
    id: `chat-p-${Date.now()}`,
    channel: pChannel,
    userId: 'u-bot',
    userName: 'Rastreador de Pendências (Fila)',
    userRole: 'Supervisor',
    content: `🚨 **Nova Pendência na Fila**: "${newP.title}" delegada para o setor "${newP.sectorResponsible}" com prazo para ${newP.dueDate}.`,
    createdAt: new Date().toISOString()
  };
  chatMessages.push(chatAlert);

  res.status(201).json(newP);
});

app.put('/api/pendencias/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, sectorResponsible, userResponsibleId, targetArea, status, dueDate, projectId, taskId } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-1';
  const author = users.find(u => u.id === userId);

  const p = pendencias.find(item => item.id === id);
  if (!p) return res.status(404).json({ error: 'Pendência não encontrada.' });

  const oldStatus = p.status;
  if (title !== undefined) p.title = title;
  if (description !== undefined) p.description = description;
  if (sectorResponsible !== undefined) p.sectorResponsible = sectorResponsible;
  if (userResponsibleId !== undefined) p.userResponsibleId = userResponsibleId;
  if (targetArea !== undefined) p.targetArea = targetArea;
  if (status !== undefined) p.status = status;
  if (dueDate !== undefined) p.dueDate = dueDate;
  if (projectId !== undefined) p.projectId = projectId;
  if (taskId !== undefined) p.taskId = taskId;

  if (status !== undefined && status !== oldStatus) {
    p.history.push({
      date: new Date().toISOString(),
      content: `Alteração de status de "${oldStatus}" para "${status}" por ${author?.name || 'Staff'}.`,
      userId,
      userName: author?.name || 'Staff'
    });
    
    // Auto post change in chat
    const pChannel = projectId || 'operacao';
    emitChannelEvent(pChannel, 'PENDENCIA_STATUS_CHANGED', {
      message: `📌 Pendência "${p.title}" agora está "${status}".`
    });
  }

  addAuditLog(userId, 'Atualizar Pendência', 'Pendencia', p.id, `Atualizou dados do tracker da pendência "${p.title}".`);
  res.json(p);
});

app.post('/api/pendencias/:id/history', (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-1';
  const author = users.find(u => u.id === userId);

  const p = pendencias.find(item => item.id === id);
  if (!p) return res.status(404).json({ error: 'Pendência não encontrada.' });

  p.history.push({
    date: new Date().toISOString(),
    content: content || 'Atualização em andamento.',
    userId,
    userName: author?.name || 'Staff'
  });

  addAuditLog(userId, 'Interação na Pendência', 'Pendencia', p.id, `Inseriu nota histórica na pendência: "${content}".`);
  res.json(p);
});

// Chat Channels CRUD
app.get('/api/channels', (req, res) => {
  res.json(chatChannels);
});

app.post('/api/channels', (req, res) => {
  const { name, type, projectId, sector, userIds } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-3';

  const newC: ChatChannel = {
    id: `chan-${Date.now()}`,
    name: name || 'Novo Canal',
    type: type || 'temporario',
    projectId,
    sector,
    userIds: userIds || [],
    createdAt: new Date().toISOString(),
    creatorId: userId
  };

  chatChannels.push(newC);
  addAuditLog(userId, 'Criar Canal Chat', 'Chat', newC.id, `Criou canal de comunicação "${newC.name}" de tipo ${newC.type}.`);
  res.status(201).json(newC);
});

// Knowledge Base Documents CRUD
app.get('/api/knowledge-docs', (req, res) => {
  res.json(knowledgeDocs);
});

app.post('/api/knowledge-docs', (req, res) => {
  const { title, category, content, links } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-3';

  const newDoc: KnowledgeDoc = {
    id: `doc-${Date.now()}`,
    title: title || 'Novo Documento Técnico',
    category: category || 'Procedimentos',
    content: content || '',
    links: links || [],
    createdAt: new Date().toISOString(),
    authorId: userId
  };

  knowledgeDocs.unshift(newDoc);
  addAuditLog(userId, 'Criar Documento Base', 'User', newDoc.id, `Procedeu o upload técnico: "${newDoc.title}".`);
  res.status(201).json(newDoc);
});

app.put('/api/knowledge-docs/:id', (req, res) => {
  const { id } = req.params;
  const { title, category, content, links } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-1';

  const doc = knowledgeDocs.find(item => item.id === id);
  if (!doc) return res.status(404).json({ error: 'Documento não localizado.' });

  if (title !== undefined) doc.title = title;
  if (category !== undefined) doc.category = category;
  if (content !== undefined) doc.content = content;
  if (links !== undefined) doc.links = links;
  doc.updatedAt = new Date().toISOString();

  addAuditLog(userId, 'Editar Documento Base', 'User', doc.id, `Atualizou o sumário técnico ou anexo do documento: "${doc.title}".`);
  res.json(doc);
});

// Specialist Teams CRUD
app.get('/api/teams', (req, res) => {
  res.json(teams);
});

app.post('/api/teams', (req, res) => {
  const { name, description, sector, leaderId, memberIds, tags } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-3';

  const newTeam: Team = {
    id: `team-${Date.now()}`,
    name: name || 'Novo Time Operacional',
    description: description || '',
    sector: sector || 'Geral',
    leaderId: leaderId || userId,
    memberIds: memberIds || [],
    tags: tags || [],
    createdAt: new Date().toISOString()
  };

  teams.push(newTeam);
  addAuditLog(userId, 'Cadastrar Time Especializado', 'Team', newTeam.id, `Sistematizou squad "${newTeam.name}" sob o setor "${newTeam.sector}".`);
  res.status(201).json(newTeam);
});

app.put('/api/teams/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, sector, leaderId, memberIds, tags } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-3';

  const t = teams.find(item => item.id === id);
  if (!t) return res.status(404).json({ error: 'Time não encontrado.' });

  if (name !== undefined) t.name = name;
  if (description !== undefined) t.description = description;
  if (sector !== undefined) t.sector = sector;
  if (leaderId !== undefined) t.leaderId = leaderId;
  if (memberIds !== undefined) t.memberIds = memberIds;
  if (tags !== undefined) t.tags = tags;

  addAuditLog(userId, 'Atualizar Time Especializado', 'Team', t.id, `Atualizou estrutura de componentes para a squad: "${t.name}".`);
  res.json(t);
});

// Full User Update (Admin and organogram mapping)
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, role, email, status, active, reportsToUserId, permissions } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-4'; // Mariana by default

  const u = users.find(item => item.id === id);
  if (!u) return res.status(404).json({ error: 'Usuário não localizado.' });

  if (name !== undefined) u.name = name;
  if (role !== undefined) u.role = role;
  if (email !== undefined) u.email = email;
  if (status !== undefined) u.status = status as any;
  if (active !== undefined) u.active = active;
  if (reportsToUserId !== undefined) u.reportsToUserId = reportsToUserId;
  if (permissions !== undefined) u.permissions = permissions;

  addAuditLog(userId, 'Editar Perfil / Permissões Admin', 'User', u.id, `Alterou dados operacionais administrativos de ${u.name}.`);
  res.json(u);
});

// Chronometer (Time Logs)
app.get('/api/timers', (req, res) => {
  res.json(timeEntries);
});

app.post('/api/timer/start', (req, res) => {
  const { taskId, projectId, description } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-1';
  const user = users.find(u => u.id === userId);

  // Stop any active timers for this user
  timeEntries.forEach(te => {
    if (te.userId === userId && te.isActive) {
      te.isActive = false;
      te.endTime = new Date().toISOString();
      te.durationSeconds += Math.floor((Date.now() - new Date(te.startTime).getTime()) / 1000) - te.pausedSeconds;
    }
  });

  const task = tasks.find(t => t.id === taskId);
  const project = projects.find(p => p.id === (projectId || task?.projectId)) || projects[0];

  const newEntry: TimeEntry = {
    id: `te-${Date.now()}`,
    userId,
    userName: user ? user.name : 'Analista',
    taskId,
    taskTitle: task?.title,
    projectId: project.id,
    projectName: project.name,
    description: description || `Execução da demanda ${task ? task.title : project.name}`,
    startTime: new Date().toISOString(),
    durationSeconds: 0,
    pausedSeconds: 0,
    pauses: [],
    isActive: true,
    isPaused: false
  };

  timeEntries.unshift(newEntry);
  addAuditLog(userId, 'Iniciar Cronômetro', 'Timer', newEntry.id, `Ativou cronômetro para "${newEntry.description}".`);

  res.status(201).json(newEntry);
});

app.post('/api/timer/pause', (req, res) => {
  const { timerId } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-1';
  const entry = timeEntries.find(te => te.id === timerId);

  if (!entry) {
    return res.status(404).json({ error: 'Timer entry not found' });
  }

  if (entry.isActive) {
    if (!entry.isPaused) {
      entry.isPaused = true;
      entry.pauses.push({ start: new Date().toISOString() });
      addAuditLog(userId, 'Pausar Cronômetro', 'Timer', entry.id, `Pausou controle da demanda.`);
    } else {
      entry.isPaused = false;
      const currentPause = entry.pauses[entry.pauses.length - 1];
      if (currentPause && !currentPause.end) {
        currentPause.end = new Date().toISOString();
        const pauseDiff = Math.floor((Date.now() - new Date(currentPause.start).getTime()) / 1000);
        entry.pausedSeconds += pauseDiff;
      }
      addAuditLog(userId, 'Retomar Cronômetro', 'Timer', entry.id, `Retomou controle da demanda.`);
    }
  }

  res.json(entry);
});

app.post('/api/timer/stop', (req, res) => {
  const { timerId } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-1';
  const entry = timeEntries.find(te => te.id === timerId);

  if (!entry) {
    return res.status(404).json({ error: 'Timer entry not found' });
  }

  if (entry.isActive) {
    entry.isActive = false;
    entry.endTime = new Date().toISOString();
    
    // Close ongoing active pause just in case
    if (entry.isPaused) {
      entry.isPaused = false;
      const currentPause = entry.pauses[entry.pauses.length - 1];
      if (currentPause && !currentPause.end) {
        currentPause.end = entry.endTime;
        const pauseDiff = Math.floor((Date.now() - new Date(currentPause.start).getTime()) / 1000);
        entry.pausedSeconds += pauseDiff;
      }
    }

    // Calculate elapsed
    const elapsedTotal = Math.floor((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000);
    entry.durationSeconds = Math.max(0, elapsedTotal - entry.pausedSeconds);

    // Accumulate on the associated task if applicable
    if (entry.taskId) {
      const task = tasks.find(t => t.id === entry.taskId);
      if (task) {
        task.timeSpent += entry.durationSeconds;
        task.updatedAt = new Date().toISOString();
      }
    }

    addAuditLog(userId, 'Parar Cronômetro', 'Timer', entry.id, `Parou cronômetro. Registrado total de ${Math.floor(entry.durationSeconds / 60)} min.`);
  }

  res.json(entry);
});

let warnedOverdueTasksToday: Record<string, boolean> = {};

// Chats
app.get('/api/chats', (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    tasks.forEach(t => {
      if (t.status !== 'Concluído' && t.dueDate && t.dueDate < todayStr) {
        const key = `${todayStr}-${t.id}`;
        if (!warnedOverdueTasksToday[key]) {
          warnedOverdueTasksToday[key] = true;
          
          const namesStr = t.assignees.map(aId => users.find(u => u.id === aId)?.name || 'Analista').join(', ') || 'Ninguém';
          
          chatMessages.push({
            id: `auto-overdue-${t.id}-${Date.now()}`,
            channel: t.projectId || 'operacao',
            userId: 'u-bot',
            userName: 'Gerenciador Operacional (IA)',
            userRole: 'Supervisor',
            content: `⚠️ **Aviso de Atraso (Tarefa Vencida)**: A tarefa de alta relevância "[${t.priority}] ${t.title}" ultrapassou seu vencimento em **${t.dueDate}** sem ser concluída. 👤 Responsáveis escalados: **${namesStr}**. Por favor, atualizem os andamentos técnicos assim que possível.`,
            createdAt: new Date().toISOString()
          });
        }
      }
    });
  } catch (err) {
    console.error('Erro na verificação de tarefas vencidas:', err);
  }

  res.json(chatMessages);
});

app.post('/api/chats', (req, res) => {
  const { channel, content, attachments } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-1';
  const user = users.find(u => u.id === userId);

  const newMessage: ChatMessage = {
    id: `m-${Date.now()}`,
    channel: channel || 'operacao',
    userId,
    userName: user ? user.name : 'Equipe',
    userRole: user ? user.role : 'Analista',
    content,
    createdAt: new Date().toISOString(),
    attachments: attachments || []
  };

  chatMessages.push(newMessage);

  // Simple mock respond if it mentions "Ia" or "Gemini" in support or projects channel
  if (content.toLowerCase().includes('gemini') || content.toLowerCase().includes('@ia') || content.toLowerCase().includes('ia ') || content.toLowerCase().includes('inteligência')) {
    const ai = getGeminiClient();
    const activeChanId = channel || 'operacao';
    
    // Find active channel context
    const chanObj = chatChannels.find(c => c.id === activeChanId);
    const relatedProj = chanObj?.projectId ? projects.find(p => p.id === chanObj.projectId) : null;
    const relevantT = relatedProj ? tasks.filter(t => t.projectId === relatedProj.id) : tasks;
    const relevantP = relatedProj ? pendencias.filter(p => p.projectId === relatedProj.id) : pendencias;
    const relevantM = relatedProj ? meetings.filter(m => m.projectId === relatedProj.id) : meetings;

    if (!ai) {
      setTimeout(() => {
        const fallbackText = `### 🤖 Assistente Virtual Britânia (Modo Off-line)
Olá, **${user?.name || 'Colega'}**! Registre a chave **GEMINI_API_KEY** no AI Studio para obter respostas 100% integradas.

**Snapshot Operacional do Canal (${chanObj?.name || 'Geral'}):**
- **Tarefas vinculadas**: ${relevantT.length} registradas (${relevantT.filter(x => x.status === 'Concluído').length} concluídas).
- **Pendências de impedimento**: ${relevantP.length} no radar técnico.
- **Reuniões agendadas**: ${relevantM.length} registradas.`;

        chatMessages.push({
          id: `m-bot-${Date.now()}`,
          channel: activeChanId,
          userId: 'u-bot',
          userName: 'Gemini Assistente (IA)',
          userRole: 'Supervisor',
          content: fallbackText,
          createdAt: new Date().toISOString()
        });
      }, 1000);
    } else {
      // Run async in background 
      (async () => {
        try {
          const systemContextPrompt = `Você é o Supervisor Virtual da equipe de Staff Britânia, respondendo no canal corporativo "${chanObj?.name || 'Geral'}".
Sua meta é ajudar o analista com respostas práticas baseadas no nosso projeto.

Dados do projeto vinculado:
- Nome: ${relatedProj ? relatedProj.name : 'Vários / Geral'}
- Objetivos: ${relatedProj ? relatedProj.objective : 'Apoio e suporte operacional'}
- SLA Limite: ${relatedProj ? relatedProj.dueDate : 'Sem prazo estrito'}
- No Kanban do Projeto, temos as seguintes tarefas em aberto:
  ${JSON.stringify(relevantT.filter(x => x.status !== 'Concluído').map(x => ({ title: x.title, priority: x.priority, status: x.status, dueDate: x.dueDate })))}
- Impedimentos e Pendências de fila no projeto:
  ${JSON.stringify(relevantP.filter(x => x.status !== 'Concluída').map(x => ({ title: x.title, status: x.status, area: x.targetArea })))}
- Próximos Eventos/Reuniões:
  ${JSON.stringify(relevantM.slice(0, 5).map(x => ({ title: x.title, date: x.date, time: x.time })))}

A pergunta enviada por ${user?.name || 'membro da equipe'} (cargo: ${user?.role || 'Analista'}) é:
"${content}"

Por favor, elabore uma resposta corporativa clara, prestativa e objetiva em Markdown. Siga as melhores instruções de engenharia de software e traga insights úteis com as tarefas especificadas acima para resolver as pendências e riscos!`;

          const responseObj = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemContextPrompt
          });

          chatMessages.push({
            id: `m-bot-${Date.now()}`,
            channel: activeChanId,
            userId: 'u-bot',
            userName: 'Gemini Assistente (IA)',
            userRole: 'Supervisor',
            content: responseObj.text || 'Desculpe, não consegui obter uma resposta.',
            createdAt: new Date().toISOString()
          });
        } catch (error: any) {
          console.error("Erro na conversação direta do chat do canal com Gemini:", error);
          chatMessages.push({
            id: `m-bot-err-${Date.now()}`,
            channel: activeChanId,
            userId: 'u-bot',
            userName: 'Gemini Assistente (IA)',
            userRole: 'Supervisor',
            content: `⚠️ Ocorreu um erro ao acionar a IA: ${error.message}. Mas aqui estão os dados locais do canal:\n\n- Número de tarefas abertas: ${relevantT.filter(x => x.status !== 'Concluído').length}\n- Pendências abertas: ${relevantP.filter(x => x.status !== 'Concluída').length}`,
            createdAt: new Date().toISOString()
          });
        }
      })();
    }
  }

  res.status(201).json(newMessage);
});

// Calendar
app.get('/api/calendar', (req, res) => {
  res.json(calendarEvents);
});

app.post('/api/calendar', (req, res) => {
  const { title, description, start, end, category, color, taskId, projectId, participants, ataText, decisions, generateTasksAutomatically } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-3';

  const newEvent: CalendarEvent = {
    id: `cal-${Date.now()}`,
    title,
    description: description || '',
    start,
    end,
    category: category || 'Outros',
    color: color || '#3b82f6',
    taskId,
    projectId,
    participants,
    ataText,
    decisions,
    generateTasksAutomatically
  };

  calendarEvents.push(newEvent);
  addAuditLog(userId, 'Criar Evento', 'Calendar', newEvent.id, `Agendou evento "${title}" para ${start.split('T')[0]}.`);
  
  const calChannel = projectId || 'operacao';
  chatMessages.push({
    id: `auto-cal-${Date.now()}`,
    channel: calChannel,
    userId: 'u-bot',
    userName: 'Gerenciador Operacional (IA)',
    userRole: 'Supervisor',
    content: `📅 **Novo Evento/Reunião Agendado**: "${title}" no dia **${start.split('T')[0]}** às **${start.split('T')[1]?.substring(0, 5) || '10:00'}h** (Categoria: **${category || 'Outros'}**).`,
    createdAt: new Date().toISOString()
  });
  
  // If "Reunião", create an associated meeting entry too
  if (category === 'Reunião') {
    const newMeeting: Meeting = {
      id: `meet-${Date.now()}`,
      title,
      date: start.split('T')[0],
      time: start.split('T')[1]?.substring(0, 5) || '10:00',
      objective: description || '',
      participants: participants || [],
      ataText: ataText || '',
      decisions: decisions || '',
      pendingIssues: '',
      responsibles: participants || [],
      nextSteps: '',
      generateTasksAutomatically: !!generateTasksAutomatically,
      projectId,
      createdAt: new Date().toISOString()
    };
    meetings.unshift(newMeeting);
    addAuditLog(userId, 'Cadastrar Reunião', 'Meeting', newMeeting.id, `Registrou reunião automática de pauta via Calendário: "${title}".`);
    
    if (newMeeting.generateTasksAutomatically) {
      const newTask: Task = {
        id: `t-${Date.now()}`,
        title: `Ações pós-reunião: ${newMeeting.title}`,
        description: `Tarefa gerada automaticamente a partir da reunião agendada em ${newMeeting.date}.`,
        status: 'A Fazer',
        priority: 'Média',
        projectId: projectId || 'proj-1',
        assignees: participants && participants.length > 0 ? participants : ['u-1'],
        subtasks: [],
        dueDate: new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0],
        tags: ['Reunião', 'Ação'],
        comments: [],
        timeSpent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        demandType: 'demanda',
        linkedMeetingId: newMeeting.id
      };
      tasks.unshift(newTask);
    }
  }

  // Notify participants immediately
  const attendeeIds = participants || [];
  attendeeIds.forEach((pId: string) => {
    pushNotification(pId, 'Novo Evento no Calendário', `Você foi convidado para a reunião "${title}" no dia ${new Date(start).toLocaleDateString('pt-BR')}`, 'info');
  });

  // Notify everyone of general events if no participants specified
  if (attendeeIds.length === 0) {
    users.forEach(u => {
      pushNotification(u.id, 'Novo Evento no Calendário', `Agendado: "${title}" para o dia ${new Date(start).toLocaleDateString('pt-BR')}`, 'info');
    });
  }

  res.status(201).json(newEvent);
});

app.put('/api/calendar/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] as string || 'u-3';
  const eventIdx = calendarEvents.findIndex(ev => ev.id === id);
  if (eventIdx === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const updatedEvent = {
    ...calendarEvents[eventIdx],
    ...req.body
  };
  calendarEvents[eventIdx] = updatedEvent;
  addAuditLog(userId, 'Atualizar Evento', 'Calendar', id, `Modificou agendamento de "${updatedEvent.title}".`);
  res.json(updatedEvent);
});

app.delete('/api/calendar/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'] as string || 'u-3';
  const eventIdx = calendarEvents.findIndex(ev => ev.id === id);
  if (eventIdx === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const deleted = calendarEvents[eventIdx];
  calendarEvents.splice(eventIdx, 1);
  addAuditLog(userId, 'Excluir Evento', 'Calendar', id, `Removeu agendamento de "${deleted.title}".`);
  res.json({ success: true });
});

// Notifications
app.get('/api/notifications', (req, res) => {
  res.json(notifications);
});

app.post('/api/notifications/read', (req, res) => {
  const userId = req.headers['x-user-id'] as string || 'u-1';
  notifications.forEach(n => {
    if (n.userId === userId || n.userId === 'all') {
      n.read = true;
    }
  });
  res.json({ success: true });
});

// Audit Logs
app.get('/api/logs', (req, res) => {
  res.json(auditLogs);
});

app.post('/api/logs', (req, res) => {
  const { action, targetType, details } = req.body;
  const userId = req.headers['x-user-id'] as string || 'u-1';
  const newLog = addAuditLog(userId, action, targetType, 'Client', details);
  res.status(201).json(newLog);
});

// Dashboard helper
app.get('/api/dashboard-summary', (req, res) => {
  // Compute performance
  const totalTasks = tasks.length;
  const completed = tasks.filter(t => t.status === 'Concluído').length;
  const pending = tasks.filter(t => t.status !== 'Concluído').length;
  const activeTimerCount = timeEntries.filter(t => t.isActive).length;
  const stableDiaries = diaries.filter(d => d.status === 'Estável').length;

  // Hours calculated from finished logs
  const totalActiveSeconds = timeEntries.reduce((acc, te) => acc + te.durationSeconds, 0) + diaries.reduce((acc, d) => acc + d.timeSpentSeconds, 0);
  const totalHours = Number((totalActiveSeconds / 3600).toFixed(1));

  // Build some analytics representation
  const weeklyDistribution = [
    { name: 'Seg', horas: 12 },
    { name: 'Ter', horas: 18 },
    { name: 'Qua', horas: totalHours > 16 ? totalHours : 16 },
    { name: 'Qui', horas: 0 },
    { name: 'Sex', horas: 0 }
  ];

  const ranking = users.map(u => {
    const userDiaries = diaries.filter(d => d.userId === u.id);
    const userTasks = tasks.filter(t => t.assignees.includes(u.id));
    const completedTasks = userTasks.filter(t => t.status === 'Concluído').length;
    return {
      userId: u.id,
      name: u.name,
      avatar: u.avatar,
      role: u.role,
      diariesCount: userDiaries.length,
      tasksCompleted: completedTasks,
      score: (userDiaries.length * 3) + (completedTasks * 5)
    };
  }).sort((a, b) => b.score - a.score);

  res.json({
    totalTasks,
    completed,
    pending,
    activeTimerCount,
    totalHours,
    stableDiariesPercent: totalTasks > 0 ? Math.round((stableDiaries / diaries.length) * 100) : 100,
    weeklyDistribution,
    ranking
  });
});

// ==========================================
// GEMINI INTELLIGENCE ASSISTANT (SERVER-SIDE API)
// ==========================================

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined in environment variables.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// 1. Resumo Inteligente com Gemini 2.5-flash
app.post('/api/gemini/summarize-diaries', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      summary: `### Resumo Executivo IA (Britânia Staff) [Modo Offline - Sem Chave de API]
Esta é uma demonstração do resumo de produção. Caso deseje conectar a inteligência em tempo real, registre a chave de segredo **GEMINI_API_KEY** no painel do AI Studio.

**Análise Operacional Local:**
- **Atividades Efetuadas**: Revisão de queries no Protheus (Ana Silva) e liberação de 450 etiquetas do SAC (Pedro Souza).
- **Áreas Críticas**: Wi-Fi na fábrica Joinville relatou congestionamento, e canais de integração de frete apresentaram taxas instáveis de limite (Timeout na Jadlog).
- **Projeção de Eficiência**: Estabilidade de 66% hoje devido a impedimentos físicos nas dependências e APIs externas. Recomenda-se acompanhamento de infraestrutura.`
    });
  }

  try {
    const prompt = `Você é o Coordenador Virtual Inteligente de Staff da Britânia. Analise os seguintes diários de bordo operacionais preenchidos pela equipe e produza um Boletim Consolidado de Gestão altamente formatado em Markdown, com termos claros em português corporativo brasileiro, abordando:
1. **Resumo Geral da Produção**: Sumarização concisa do que foi efetuado.
2. **Gargalos, Impedimentos e Riscos**: Pontos destacados como alerta ou crítico (como problemas de Wi-Fi, Timeout da Jadlog, etc).
3. **Métricas Estimadas e Eficiência**: Una análise qualitativa da produtividade.
4. **Resoluções e Recomendações Práticas**: O que a supervisão e coordenação devem priorizar amanhã.

Eis os dados dos diários preenchidos recentemente:
${JSON.stringify(diaries, null, 2)}

Seja inspirador, preciso, corporativo e bem diagramado. Evite lero-lero técnico irrelevante de infraestrutura falsa. Foco na operação Britânia.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error('Error calling Gemini API for summary:', error);
    res.status(500).json({ error: 'Erro ao gerar resumo da operação via IA.', details: error.message });
  }
});

// 2. IA Sugestão de Prioridades e Subtarefas
app.post('/api/gemini/task-priority', async (req, res) => {
  const { title, description } = req.body;
  const ai = getGeminiClient();

  if (!title) {
    return res.status(400).json({ error: 'Título é obrigatório para análise.' });
  }

  if (!ai) {
    // Mode mockup offline
    let mockPriority: TaskPriority = 'Média';
    if (title.toLowerCase().includes('crítica') || title.toLowerCase().includes('urgente') || title.toLowerCase().includes('queda') || title.toLowerCase().includes('parou')) {
      mockPriority = 'Crítica';
    } else if (title.toLowerCase().includes('ajuste') || title.toLowerCase().includes('erro')) {
      mockPriority = 'Alta';
    }

    return res.json({
      priority: mockPriority,
      explanation: `[Análise Local Off-line] Com base nos metadados de palavra-chave, sugerimos prioridade **${mockPriority}**.`,
      suggestedSubtasks: [
        'Análise de causa raiz e triagem de logs',
        'Desenvolvimento de correção em ambiente de homologação',
        'Validação conjunta com supervisão operacional'
      ]
    });
  }

  try {
    const prompt = `Analise a seguinte descrição de tarefa da equipe Staff Britânia e recomende a prioridade correta ('Baixa', 'Média', 'Alta', 'Crítica'), uma justificativa executiva sucinta e de 3 a 5 sub-tarefas operacionais ótimas.
Título da Demanda: "${title}"
Descrição: "${description || 'Sem descrição'}"

Retorne o resultado estritamente em formato JSON válido que segue o seguinte esquema:
{
  "priority": "Baixa" | "Média" | "Alta" | "Crítica",
  "explanation": "Explicação curta da prioridade baseado na descrição...",
  "suggestedSubtasks": ["mínimo 3 sub-tarefas"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priority: { type: Type.STRING, description: "Highly recommended priority: Baixa, Média, Alta, or Crítica." },
            explanation: { type: Type.STRING, description: "A concise 1-2 sentence corporate explanation." },
            suggestedSubtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Practical steps necessary to complete this specific ticket."
            }
          },
          required: ["priority", "explanation", "suggestedSubtasks"]
        }
      }
    });

    try {
      const data = JSON.parse(response.text || '{}');
      res.json(data);
    } catch (parseErr) {
      res.json({
        priority: 'Média',
        explanation: 'Foco na manutenção corretiva diária.',
        suggestedSubtasks: ['Verificar logs', 'Aplicar patch', 'Revisar com gestores']
      });
    }
  } catch (error: any) {
    console.error('Error calling Gemini for task-priority:', error);
    res.status(500).json({ error: 'Erro na análise de prioridade via inteligência artificial.' });
  }
});

// Calendar Meeting Summarizer with Gemini
app.post('/api/gemini/summarize-meeting', async (req, res) => {
  const { title, description, ataText, decisions, participantsNames } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    return res.json({
      summary: `### Resumo Executivo da Reunião: ${title || 'Alinhamento Staff'} [Modo Off-line]
**Participantes**: ${participantsNames && participantsNames.length > 0 ? participantsNames.join(', ') : 'Equipe Staff'}
**Pauta Inicial**: ${description || 'Sem pauta definida.'}

**Pontos Principais & Discussões**:
- Foram consolidados os impedimento operacionais reportados na Britânia Staff.
- A equipe alinhou passos práticos para mitigar gargalos críticos na integração e deadlocks de banco de dados.

**Decisões Consolidadas**:
- ${decisions ? decisions : 'Revisar escopo técnico e redistribuição imediata de tarefas atrasadas.'}

**Plano de Ação Recomendado**:
- Criar chamada técnica para ajustar queries e logs de deadlocks de forma resolutiva.`
    });
  }

  try {
    const prompt = `Você é o Coordenador Virtual Inteligente Staff Britânia. Sumarize a seguinte reunião e crie uma ATA formal corporativa com plano de ação consolidado prático e elegante.
    Título: "${title}"
    Pauta/Instruções: "${description || 'Nenhuma pauta'}"
    Ata/Notas da Reunião: "${ataText || 'Nenhuma nota'}"
    Decisões Prévias: "${decisions || 'Nenhuma decisão cadastrada'}"
    Convidados: ${participantsNames && participantsNames.length > 0 ? participantsNames.join(', ') : 'Equipe'}

    Retorne uma ata de reunião muito polida, profissional, formatada em Markdown com bullet-points claros.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt
    });

    res.json({ summary: response.text });
  } catch (err: any) {
    console.error('Erro no summarizes-meeting:', err);
    res.status(500).json({ error: 'Erro ao gerar ata inteligente.', details: err.message });
  }
});

// Automatic Task Generation from meetings decisions
app.post('/api/gemini/auto-tasks', async (req, res) => {
  const { eventId, projectId, title, decisions, participants } = req.body;
  const ai = getGeminiClient();
  let extractedTasks: string[] = [];

  if (!ai) {
    if (decisions) {
      extractedTasks = decisions
        .split('\n')
        .map((line: string) => line.replace(/^[\s*-]+/, '').trim())
        .filter((line: string) => line.length > 5);
    }
    if (extractedTasks.length === 0) {
      extractedTasks = [
        `Alinhamento técnico pós-reunião: ${title}`,
        `Revisar pendências decorrentes de: ${title}`
      ];
    }
  } else {
    try {
      const prompt = `Analise as seguintes decisões tomadas em uma reunião e extraia uma lista de tarefas práticas acionáveis (máximo 4 tarefas). Retorne estritamente um array JSON de strings de tarefas.
      Reunião: "${title}"
      Decisões: "${decisions || 'Revisar processos'}"
      
      Formato de retorno esperado: ["Tarefa 1", "Tarefa 2"]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      extractedTasks = JSON.parse(response.text || '[]');
    } catch (err) {
      console.error('Erro ao extrair tarefas de reuniões com Gemini:', err);
      extractedTasks = [`Ação pós-reunião: ${title}`];
    }
  }

  // Create tasks in the backend list
  const createdTasksList: Task[] = [];
  const defaultProjId = projectId || 'proj-1';
  const assigneesList = participants || ['u-1'];

  extractedTasks.forEach((taskTitle, idx) => {
    const newTask: Task = {
      id: `t-${Date.now()}-${idx}`,
      title: taskTitle,
      description: `Tarefa gerada automaticamente via IA a partir das decisões da reunião "${title}".`,
      status: 'A Fazer',
      priority: 'Média',
      projectId: defaultProjId,
      assignees: assigneesList,
      subtasks: [],
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: ['Reunião', 'Automatico-IA'],
      comments: [],
      timeSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      demandType: 'demanda',
      linkedMeetingId: eventId
    };
    tasks.unshift(newTask);
    createdTasksList.push(newTask);
  });

  // Notify participants of the auto-generated tasks
  const attendeeIds = participants || [];
  attendeeIds.forEach((pId: string) => {
    pushNotification(pId, 'Tarefas Geradas via IA', `Novas tarefas acionáveis surgiram para você decorrentes da reunião "${title}"`, 'success');
  });

  res.status(201).json({ success: true, createdTasks: createdTasksList });
});

// 3. Insights inteligentes de produtividade com Gemini
app.post('/api/gemini/productivity-insights', async (req, res) => {
  const ai = getGeminiClient();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  
  const recentDiaries = diaries.filter(d => d.date >= fourteenDaysAgo.split('T')[0]);
  const recentTasks = tasks.filter(t => t.updatedAt >= fourteenDaysAgo);
  const recentTimeEntries = timeEntries.filter(t => t.startTime >= fourteenDaysAgo);

  if (!ai) {
    return res.json({
      insights: [
        '**Gargalo de Alocação (SAC)**: Concentração excessiva de demandas críticas de rotulagem e logística sob responsabilidade exclusiva de Pedro Souza.',
        '**Foco em Banco (Protheus)**: Ana Silva acumula mais de 12h de esforço recente em correção de deadlocks. Risco de fadiga operacional identificado.',
        '**Desvio de SLA de Homologação**: Tarefas do projeto SAC Web passam em média 6.2 dias aguardando revisão técnica antes de serem liberadas.',
        '**Baixo Registro de Tempo em Projetos de Expansão**: O projeto Expansão Protheus registrou apenas 3% de effort nos diários nos últimos 14 dias.',
        '**Ajuste Rebalanceamento de Time**: Recomenda-se treinar um analista shadow para as integrações Jadlog.'
      ]
    });
  }

  try {
    const prompt = `Analise globalmente estas métricas operacionais e registros dos últimos 14 dias da equipe Staff Britânia, agrupando por colaborador e projeto para produzir de 5 a 8 insights analíticos precisos, focados em:
1. Gargalos de alocação de equipe (sobrecarga/concentração de tarefas)
2. Riscos de ócio ou falta de imputs de tempo em projetos críticos
3. Desvios de SLAs e tempos de espera altos
4. Diretiva clara de rebalanceamento de carga de trabalho do time

Dados recentes de 14 dias:
- Diários de Bordo Recentes: ${JSON.stringify(recentDiaries.map(d => ({ user: d.userName, project: d.projectName, text: d.performedText, status: d.status })))}
- Tarefas Atualizadas: ${JSON.stringify(recentTasks.map(t => ({ title: t.title, status: t.status, assignees: t.assignees })))}
- Lançamentos de Tempo Recentes: ${JSON.stringify(recentTimeEntries.map(e => ({ user: e.userId, duration: e.durationSeconds, taskId: e.taskId })))}

Por favor, escreva de 5 a 8 insights diretos, altamente realistas e acionáveis focado na operação Britânia, em português corporativo do Brasil, formatados com negrito para chamar atenção a métricas ou termos relevantes. Retorne exclusivamente um array JSON contendo as strings dos insights.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    try {
      const arr = JSON.parse(response.text || '[]');
      res.json({ insights: arr });
    } catch {
      res.json({
        insights: [
          '**Gargalo de Atendimento**: Foco excessivo em tarefas isoladas do SAC.',
          '**Performance de Banco**: Otimizar queries antes do horário comercial.',
          '**Resiliência Industrial**: Melhoria no Wi-Fi Joinville é prioridade técnica.'
        ]
      });
    }
  } catch (error: any) {
    console.error('Error generating productivity insights:', error);
    res.status(500).json({ error: 'Erro gerando insights de produtividade.' });
  }
});

// 4. IA Relatório de Inteligência para Gestão de Times
app.post('/api/gemini/team-report', async (req, res) => {
  const { teamId, team: bodyTeam, members: bodyMembers, openTasks: bodyOpen, completedTasks: bodyCompleted, pendencias: bodyPendencias, bottlenecks: bodyBottlenecks, criticalDeadlines: bodyDeadlines } = req.body;
  const ai = getGeminiClient();

  const team = bodyTeam || teams.find(t => t.id === teamId) || teams[0];
  const teamMembers = bodyMembers || users.filter(u => team.memberIds.includes(u.id));
  const teamTasks = tasks.filter(t => t.assignees.some(aId => team.memberIds.includes(aId)));
  
  const openTasks = bodyOpen || teamTasks.filter(t => t.status !== 'Concluído');
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const completedTasks = bodyCompleted || teamTasks.filter(t => t.status === 'Concluído' && t.updatedAt >= thirtyDaysAgo);
  
  const teamPendencias = bodyPendencias || pendencias.filter(p => p.sectorResponsible === team.sector);
  
  // Bottlenecks: status 'Em Andamento' or 'A Fazer' stalled for 5 days
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const bottlenecks = bodyBottlenecks || teamTasks.filter(t => (t.status === 'Em Andamento' || t.status === 'A Fazer') && t.updatedAt <= fiveDaysAgo);
  
  // Critical deadlines: dueDate < today + 7d and status != Concluído
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const criticalDeadlines = bodyDeadlines || teamTasks.filter(t => t.status !== 'Concluído' && t.dueDate && t.dueDate <= sevenDaysFromNow && t.dueDate >= todayStr);

  const teamOpen = openTasks.length;
  const teamCompleted = completedTasks.length;

  if (!ai) {
    return res.json({
      report: `### 📊 Relatório de Auditoria Inteligente: ${team.name} [Modo Offline - Sem Chave Gemini]
*Líder do Squad: ${users.find(u => u.id === team.leaderId)?.name || 'Carlos Rodrigues'}*

#### Visão geral
Análise de alocação de squads e conformidade Britânia.

#### Demandas em aberto
Atualmente, o time possui **${teamOpen}** tarefas abertas no Kanban.

#### Demandas concluídas
Foram concluídas **${teamCompleted}** tarefas nos últimos 30 dias.

#### Pendências
Existem **${teamPendencias.length}** pendências vinculadas ao setor.

#### Gargalos
Identificados **${bottlenecks.length}** gargalos técnicos em tarefas prontas para entrega.

#### Plano de ação sugerido
1. Redistribuir tarefas do faturamento e realizar auditoria diária.

#### Indicadores de produtividade
SLA estável em 88%.

#### Riscos
Risco médio de prazo em entregas críticas devido a dependências técnicas externas.

#### Prazos críticos
Temos **${criticalDeadlines.length}** prazos críticos mapeados para a semana.`
    });
  }

  try {
    const prompt = `Você é o Diretor da Operação de Sistemas e Consultor Gerencial de Alta Performance da Britânia. Analise os seguintes dados do time operacional para gerar uma análise detalhada:

Time: "${team.name}" (Setor: "${team.sector}")
Líder: ${users.find(u => u.id === team.leaderId)?.name || 'Não atribuído'}
Membros: ${JSON.stringify(teamMembers.map((m: any) => ({ name: m.name, role: m.role })))}

Métricas de Kanban e SLAs Sincronizadas:
- Demandas em Aberto (${teamOpen}): ${JSON.stringify(openTasks.map((t: any) => ({ title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate })))}
- Demandas Concluídas nos últimos 30 dias (${teamCompleted}): ${JSON.stringify(completedTasks.map((t: any) => ({ title: t.title, dueDate: t.dueDate })))}
- Pendências de Setor (${teamPendencias.length}): ${JSON.stringify(teamPendencias.map((p: any) => ({ title: p.title, status: p.status })))}
- Gargalos / Tarefas Estagnadas (${bottlenecks.length}): ${JSON.stringify(bottlenecks.map((t: any) => ({ title: t.title, status: t.status, updatedAt: t.updatedAt })))}
- Prazos Críticos nos próximos 7 dias (${criticalDeadlines.length}): ${JSON.stringify(criticalDeadlines.map((t: any) => ({ title: t.title, dueDate: t.dueDate, priority: t.priority })))}

Gere um Relatório de Auditoria Operacional corporativo, estruturado e com design visual elegante em Markdown de alto impacto abordando obrigatória e precisamente as seguintes seções estritas:
1. **Visão geral**
2. **Demandas em aberto**
3. **Demandas concluídas**
4. **Pendências**
5. **Gargalos**
6. **Plano de ação sugerido**
7. **Indicadores de produtividade**
8. **Riscos**
9. **Prazos críticos**

Escreva tudo de forma corporativa refinada em português brasileiro.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    res.json({ report: response.text });
  } catch (error: any) {
    console.error('Error in team-report AI:', error);
    res.status(500).json({ error: 'Erro de comunicação com o serviço Gemini.' });
  }
});

// 5. Chat Bot Assistente de Canal Inteligente
app.post('/api/gemini/chat-query', async (req, res) => {
  const { channelId, prompt: userQuery } = req.body;
  const ai = getGeminiClient();
  const channel = chatChannels.find(c => c.id === channelId) || chatChannels[0];

  // Gather contextual info based on channel correlation
  const relatedProject = channel?.projectId ? projects.find(p => p.id === channel.projectId) : null;
  const relevantTasks = relatedProject ? tasks.filter(t => t.projectId === relatedProject.id) : tasks;
  const relevantDiaries = relatedProject ? diaries.filter(d => d.projectId === relatedProject.id) : diaries;
  const relevantPendencias = relatedProject ? pendencias.filter(p => p.projectId === relatedProject.id) : pendencias;

  // Let's rich-enrich standard constraints:
  const openProjectTasks = relevantTasks.filter(t => t.status !== 'Concluído');
  const sectorPendencias = pendencias.filter(p => p.sectorResponsible === (relatedProject?.sector || 'Tecnologia') && p.status !== 'Concluída');
  const futureMeetings = meetings.filter(m => m.projectId === relatedProject?.id);
  const recentChatHistory = chatMessages.filter(m => m.channel === channelId).slice(-20);

  if (!ai) {
    return res.json({
      response: `### 🤖 Assistente Virtual Britânia (Modo Simulado - Sem Chave Gemini)
Estou atuando sob contexto do canal **${channel?.name || 'Geral'}** (${channel?.type === 'projeto' ? 'Canal de Projeto' : 'Canal Setorial'}).

**Painel Operacional do Canal:**
- **Tarefas no Kanban**: ${relevantTasks.length} registradas (${relevantTasks.filter(t => t.status === 'Concluído').length} concluídas).
- **Pendências de Fila**: ${relevantPendencias.length} sob acompanhamento técnico.
- **Volume do Diário de Bordo**: ${relevantDiaries.length} logs de bordo inseridos na história operacional do projeto.

*Recomendação*: Registre a chave de segredo **GEMINI_API_KEY** no AI Studio para obter respostas contextuais integradas e personalizadas em tempo real.`
    });
  }

  try {
    const prompt = `Você é o Assistente Gemini de Staff Britânia, ativo no canal de equipe cooperativo "${channel?.name || 'Geral'}" (tipo: ${channel?.type}).
Sua missão é dar insights precisos, resumir o status das demandas, planejar ações, alertar de riscos e gargalos e apoiar os times de forma assertiva e direta.

Dados contextuais do projeto/setor sincronizados em tempo real:
- Canal correspondente ao projeto: ${relatedProject ? relatedProject.name : 'Geral / Todos os Projetos'}
- Metadados do Projeto: ${JSON.stringify(relatedProject ? { objective: relatedProject.objective, goals: relatedProject.goals, dueDate: relatedProject.dueDate, priority: relatedProject.priority, status: relatedProject.status } : 'Geral')}
- Lista de Tarefas em Aberto (${openProjectTasks.length}): ${JSON.stringify(openProjectTasks.map(t => ({ title: t.title, status: t.status, priority: t.priority })))}
- Pendências do Setor: ${JSON.stringify(sectorPendencias.map(p => ({ title: p.title, status: p.status })))}
- Reuniões Futuras/Agendadas para esse escopo: ${JSON.stringify(futureMeetings.map(m => ({ title: m.title, date: m.date, time: m.time })))}
- Últimos 20 históricos de conversa no canal de chat:
${JSON.stringify(recentChatHistory.map(m => `${m.userName} (${m.userRole}): ${m.content}`))}

A consulta inserida pela equipe no canal é a seguinte:
"${userQuery}"

Escreva uma resposta de alto nível em português corporativo do Brasil, formatada em Markdown, sendo muito prestativo, objetivo e focado em apoiar a equipe a tomar decisões operacionais inteligentes baseadas nas tarefas e históricos providos.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    res.json({ response: response.text });
  } catch (error: any) {
    console.error('Error in chat-query AI:', error);
    res.status(500).json({ error: 'Erro ao processar consulta da inteligência artificial no canal.' });
  }
});

// 6. IA Daily Operational Brief (NOVO)
app.post('/api/gemini/daily-brief', async (req, res) => {
  const { userId } = req.body;
  const targetUserId = userId || req.headers['x-user-id'] as string || 'u-1';
  const user = users.find(u => u.id === targetUserId);
  const ai = getGeminiClient();

  const userTasks = tasks.filter(t => t.assignees.includes(targetUserId));
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = userTasks.filter(t => t.status !== 'Concluído' && t.dueDate && t.dueDate < todayStr);
  const todayEvents = calendarEvents.filter(ev => ev.start.startsWith(todayStr));
  const userSector = user ? user.role : 'Tecnologia';
  const sectorPendencias = pendencias.filter(p => p.sectorResponsible === userSector && p.status !== 'Concluída');

  if (!ai) {
    return res.json({
      brief: `### 🗓️ Resumo Diário Operacional - ${user?.name || 'Staff'} [Modo Offline]
Esta é uma simulação do seu briefing diário.

**Minhas Tarefas Atrasadas:**
- Atualmente você possui ${overdueTasks.length} tarefas atrasadas no Kanban.

**Reuniões de Hoje:**
- Foram encontrados ${todayEvents.length} compromissos agendados no Calendário.

**Pendências Críticas do Setor:**
- Há ${sectorPendencias.length} pendências do setor para acompanhar hoje.

*Britânia Staff - Qualidade e inovação começam todos os dias!*`
    });
  }

  try {
    const prompt = `Você é o Coordenador Virtual Inteligente Staff Britânia. Crie um Boletim de Briefing Diário individual, inspirador e totalmente focado em produtividade para o colaborador "${user?.name || 'Staff'}" (Cargo/Setor: "${user?.role || 'Staff'}").

Dados contextuais deste profissional:
- Suas tarefas vencidas ou atrasadas: ${JSON.stringify(overdueTasks.map(t => ({ title: t.title, dueDate: t.dueDate, priority: t.priority })))}
- Seus compromissos de hoje: ${JSON.stringify(todayEvents.map(e => ({ title: e.title, start: e.start, end: e.end })))}
- Pendências de atenção em seu setor/área: ${JSON.stringify(sectorPendencias.map(p => ({ title: p.title, dueDate: p.dueDate })))}

Por favor, gere um Markdown estruturado em português do Brasil com as seguintes seções claras:
1. **Destaques Críticos da Manhã** (com suas tarefas de maior foco)
2. **Agenda de Alinhamentos e Reuniões para Hoje**
3. **Pendências Importantes do Setor**
4. **Insight Motivacional Operacional Britânia** (um parágrafo sob medida focado em eficiência empresarial e superação).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ brief: response.text });
  } catch (error: any) {
    console.error('Error in daily-brief AI:', error);
    res.status(500).json({ error: 'Erro ao gerar o briefing diário com a IA.' });
  }
});

// 7. IA Meeting Summary and Action Points (NOVO)
app.post('/api/gemini/meeting-summary', async (req, res) => {
  const { meetingId } = req.body;
  const ai = getGeminiClient();
  const meeting = meetings.find(m => m.id === meetingId);

  if (!meeting) {
    return res.status(404).json({ error: 'Reunião não encontrada.' });
  }

  if (!ai) {
    return res.json({
      summary: `### 📋 Sumário da Reunião: ${meeting.title} [Modo Offline]
Esta é uma simulação do sumário analítico da ata.

- **Objetivo**: ${meeting.objective || 'Não informado.'}
- **Principais Decisões**: ${meeting.decisions || 'Nenhuma decisão cadastrada.'}
- **Próximos Passos recomendados**: Executar ações imediatas com prazo estipulado de 5 dias.
`
    });
  }

  try {
    const prompt = `Você é o Assessor de Governança Digital Staff Britânia. Analise estes dados da ata de reunião:
Título: "${meeting.title}"
Data: ${meeting.date} às ${meeting.time}
Objetivo: "${meeting.objective}"
Participantes: ${JSON.stringify(meeting.participants)}
Ata Completa: "${meeting.ataText}"
Decisões Mapeadas: "${meeting.decisions}"
Pendências Declaradas: "${meeting.pendingIssues}"
Próximos Passos Indicados: "${meeting.nextSteps}"

Por favor, elabore um Sumário Analítico Executivo refinado em Markdown (português corporativo brasileiro) contemplando:
1. **Visão Geral e Alinhamento Estratégico**
2. **Tabela de Pontos de Ação** (atribuindo responsabilidade e sugestão de prioridade)
3. **Plano de Próximos Passos sugeridos** (com prazos estimados e entregáveis)
4. **Riscos e mitigações** baseados nos tópicos de discussão das atas.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error('Error in meeting-summary AI:', error);
    res.status(500).json({ error: 'Erro ao gerar o sumário da ata com a IA.' });
  }
});

// 8. IA Risk Alert and Project Health Meter (NOVO)
app.post('/api/gemini/risk-alert', async (req, res) => {
  const { projectId } = req.body;
  const ai = getGeminiClient();
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return res.status(404).json({ error: 'Projeto não encontrado.' });
  }

  const projTasks = tasks.filter(t => t.projectId === projectId);
  const projPendencias = pendencias.filter(p => p.projectId === projectId);
  
  // Calculate basic health factors
  const totalTasks = projTasks.length;
  const completedTasks = projTasks.filter(t => t.status === 'Concluído').length;
  const openTasks = totalTasks - completedTasks;
  const overdueTasksCount = projTasks.filter(t => {
    if (t.status === 'Concluído') return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return t.dueDate && t.dueDate < todayStr;
  }).length;
  const openPendenciasCount = projPendencias.filter(p => p.status !== 'Concluída').length;

  // Simple local calc of health score starting at 100, deducting for risks
  let computedScore = 100;
  if (totalTasks > 0) {
    computedScore -= (overdueTasksCount / totalTasks) * 40;
    computedScore -= (openPendenciasCount * 10);
  } else {
    computedScore = 80; // Default if empty
  }
  const healthScore = Math.max(0, Math.min(100, Math.round(computedScore)));

  if (!ai) {
    return res.json({
      healthScore,
      risks: `### 🚨 Análise de Risco Operacional: ${project.name} [Modo Offline]
- **Pontuação de Saúde**: **${healthScore}/100**
- **Sinalização**: ${healthScore > 75 ? '🟢 Estável' : healthScore > 45 ? '🟡 Atenção' : '🔴 Crítico'}

**Riscos Identificados:**
1. **Deadlines & Overdue**: Há ${overdueTasksCount} tarefas com prazo limite excedido no Kanban.
2. **Fila de Pendências**: Existem ${openPendenciasCount} impedimentos operacionais pendentes de resolução.`
    });
  }

  try {
    const prompt = `Você é o Analista Sênior de Riscos e Auditoria Corporativa da Britânia. Analise as métricas reais do projeto para calcular os riscos de atraso de entrega e impacto operacional.

Dados do Projeto:
Nome: "${project.name}"
Status: "${project.status}"
Prazo Limite: ${project.dueDate}
Métricas de Kanban: Total de ${totalTasks} tarefas, com ${completedTasks} concluídas e ${openTasks} em aberto.
Tarefas Atrasadas/Vencidas: ${overdueTasksCount}
Pendências em Fila Não Resolvidas: ${openPendenciasCount}

Submódulo de tarefas completas: ${JSON.stringify(projTasks.map(t => ({ title: t.title, status: t.status, dueDate: t.dueDate, priority: t.priority })))}
Submódulo de pendências vinculadas: ${JSON.stringify(projPendencias.map(p => ({ title: p.title, status: p.status })))}

Por favor, gere uma resposta estritamente no formato JSON estruturado que siga o esquema:
{
  "healthScore": 0-100 (número inteiro refletindo a saúde do projeto sob métricas de entrega e atraso),
  "risks": "Markdown formatado com os riscos específicos e alertas de atraso de prazo e ações práticas de contenção"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.INTEGER, description: "Calculated health score from 0 (critical) to 100 (perfect)." },
            risks: { type: Type.STRING, description: "Markdown text detailing threat analysis, risk events, SLA alerts, and action recommendations." }
          },
          required: ["healthScore", "risks"]
        }
      }
    });

    try {
      const data = JSON.parse(response.text || '{}');
      res.json(data);
    } catch {
      res.json({
        healthScore,
        risks: `### 🚨 Erro de Parsing - Relatório de Risco Local\nSaúde do Projeto: ${healthScore}/100\nAnálise de risco gerada, mas houve erro no formato JSON.`
      });
    }
  } catch (error: any) {
    console.error('Error in risk-alert AI:', error);
    res.status(500).json({ error: 'Erro ao gerar análise de riscos do projeto.' });
  }
});


// Vite Dev Server Integration & Static Asset serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Vite Server] Servidor Diário de Bordo Britânia rodando na porta ${PORT}`);
  });
}

startServer();
