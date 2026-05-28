export type Role = 'Analista' | 'Supervisor' | 'Gestão';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  email: string;
  status: 'Online' | 'Ocupado' | 'Ausente' | 'Offline';
  active?: boolean; // Se o usuário está ativo/desativado
  reportsToUserId?: string; // ID do chefe/supervisor imediato
  permissions?: {
    canEditSettings: boolean;
    canCreateProjects: boolean;
    canRegisterMeetings: boolean;
    canManageUsers: boolean;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string; // hex or tailwind class name
  // Novos campos obrigatórios de projetos bento / gestão completa
  objective?: string;
  goals?: string;
  dueDate?: string;
  deliverables?: string;
  assignees?: string[]; // IDs de colaboradores responsáveis
  supervisors?: string[]; // IDs de supervisores
  observers?: string[]; // IDs de observadores
  sector?: string;
  tools?: string;
  priority?: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  status?: 'Planejamento' | 'Ativo' | 'Pausado' | 'Concluído';
  budget?: string;
  risks?: string;
  dependencies?: string;
  successIndicators?: string;
  createdAt?: string;
}

export type Category = 'Desenvolvimento' | 'Suporte(Chamado)' | 'Reunião' | 'Monitoramento' | 'Infraestrutura' | 'Documentação' | 'Melhoria';

export type TaskPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type TaskStatus = 'Backlog' | 'A Fazer' | 'Em Andamento' | 'Em Revisão' | 'Concluído';

export type DemandType = 'projeto' | 'demanda' | 'pendencia' | 'recorrente';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string; // Se vinculado a projeto
  assignees: string[]; // User IDs
  observers?: string[]; // User IDs observadores
  subtasks: Subtask[]; // checklist
  dueDate: string;
  tags: string[];
  comments: Comment[];
  timeSpent: number; // em segundos
  createdAt: string;
  updatedAt: string;
  
  // Novos campos para diferenciação de demandas e agrupamento
  demandType?: DemandType; // 'projeto' | 'demanda' | 'pendencia' | 'recorrente'
  history?: { date: string; content: string; userName: string }[];
  attachments?: { name: string; size: string; url: string }[];
  
  // Vínculos avançados
  linkedProjectId?: string;
  linkedDemandId?: string;
  linkedEventId?: string;
  linkedMeetingId?: string;
  linkedPendenciaId?: string;
  linkedDiarioId?: string;
}

// Gestão de Pendências robusto com histórico e atrasos
export interface Pendencia {
  id: string;
  title: string;
  description: string;
  sectorResponsible: string; // Setor responsável
  userResponsibleId: string; // Colaborador responsável
  targetArea: string; // Área que deve finalizar a atividade
  status: 'Pendente' | 'Em Andamento' | 'Em Tratativa' | 'Vencida' | 'Concluída';
  dueDate: string; // Prazo para mensurar atraso
  createdAt: string;
  projectId?: string;
  taskId?: string;
  history: {
    date: string;
    content: string;
    userId: string;
    userName: string;
  }[];
}

// Registro de Reuniões no Diário que geram tarefas
export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  objective: string;
  participants: string[]; // User IDs
  ataText: string;
  decisions: string;
  pendingIssues: string;
  responsibles: string[]; // User IDs das tarefas geradas
  nextSteps: string;
  generateTasksAutomatically: boolean;
  projectId?: string; // Vínculo a projeto
  createdAt: string;
}

// Canais de Chat Inteligentes
export interface ChatChannel {
  id: string;
  name: string;
  type: 'projeto' | 'setor' | 'temporario' | 'privado';
  projectId?: string;
  sector?: string;
  userIds?: string[]; // Se privado, lista de acessos
  createdAt: string;
  creatorId?: string;
  desc?: string;
  isPrivate?: boolean;
  allowedUserIds?: string[];
  expiresAt?: string; // ISO string para temporários
}

// Central Operacional / Base de Conhecimento Interno
export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string; // 'Procedimentos' | 'Fluxos Operacionais' | 'Manuais' | 'Guias'
  content: string; // Markdown/RichText
  links: { label: string; url: string }[];
  createdAt: string;
  updatedAt?: string;
  authorId: string;
}

// Times Especializados estruturados por tipo de demanda
export interface Team {
  id: string;
  name: string;
  description: string;
  sector: string;
  leaderId: string; // User ID do líder/supervisor
  memberIds: string[]; // User IDs dos integrantes
  tags?: string[]; // Que tipo de demandas cuidam
  createdAt: string;
}

export interface DiarioEntry {
  id: string;
  date: string;
  createdAt: string;
  userId: string;
  userName: string;
  userRole: Role;
  projectId: string;
  projectName: string;
  category: Category;
  performedText: string; // O que foi realizado no dia
  problemsText: string;  // Problemas encontrados
  completedDemands: string; // Demandas concluídas
  observations: string; // Observações importantes
  status: 'Estável' | 'Alerta' | 'Atencioso'; // Status da Operação
  pendingText: string; // Pendências
  nextSteps: string; // Próximos passos
  timeSpentSeconds: number; // Tempo gasto
  tags: string[];
}

export interface PauseInterval {
  start: string;
  end?: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  taskId?: string;
  taskTitle?: string;
  projectId: string;
  projectName: string;
  description: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  pausedSeconds: number;
  pauses: PauseInterval[];
  isActive: boolean;
  isPaused: boolean;
}

export interface ChatMessage {
  id: string;
  channel: string; // 'operacao' | 'supervisao' | 'projetos' | 'avisos' | 'suporte' | channelId ou private-ID
  userId: string;
  userName: string;
  userRole: Role;
  content: string;
  createdAt: string;
  attachments?: { name: string; size: string; url: string }[];
}



export interface Notification {
  id: string;
  userId: string; // target user or 'all'
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  type: 'info' | 'warning' | 'success' | 'alert';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  targetType: string; // 'Task' | 'Diario' | 'Timer' | 'Chat' | 'User' | 'Project' | 'Team' | 'Meeting' | 'Pendencia'
  targetId: string;
  details: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string; // ISO String
  end: string;   // ISO String
  category: 'Reunião' | 'Manutenção' | 'Prazo' | 'Entrega' | 'Escala' | 'Outros';
  color: string; // hex or css color
  taskId?: string;
  projectId?: string;
  // Detalhes extras bento/corporativo
  participants?: string[]; // IDs de usuários convidados
  ataText?: string; // ATA/Decisões registradas no calendário
  decisions?: string;
  demandId?: string; // Demanda vinculada
  generateTasksAutomatically?: boolean;
}
