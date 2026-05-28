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
  TaskPriority,
  Meeting,
  Pendencia,
  ChatChannel,
  KnowledgeDoc,
  Team
} from '../types';

// Client-side authentication simulator
const CURRENT_USER_KEY = 'britania_staff_current_user';
const THEME_KEY = 'britania_staff_theme';

export function getStoredCurrentUser(): string {
  // Safe default
  return localStorage.getItem(CURRENT_USER_KEY) || 'u-1';
}

export function setStoredCurrentUser(userId: string): void {
  localStorage.setItem(CURRENT_USER_KEY, userId);
  // Reload or trigger synthetic state update
  window.dispatchEvent(new Event('user-changed'));
}

export function getStoredTheme(): 'light' | 'dark' {
  return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'dark';
}

export function setStoredTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(THEME_KEY, theme);
  const root = window.document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Request Helper
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const userId = getStoredCurrentUser();
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': userId,
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Erro de rede: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const AppApi = {
  // Users
  getUsers: () => request<User[]>('/api/users'),
  createUser: (user: Partial<User>) => request<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(user)
  }),
  updateUserStatus: (userId: string, status: string) => request<User>(`/api/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),
  updateUser: (userId: string, fields: Partial<User>) => request<User>(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(fields)
  }),

  // Projects
  getProjects: () => request<Project[]>('/api/projects'),
  createProject: (proj: Partial<Project>) => request<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(proj)
  }),
  updateProject: (id: string, proj: Partial<Project>) => request<Project>(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(proj)
  }),
  deleteProject: (id: string) => request<any>(`/api/projects/${id}`, {
    method: 'DELETE'
  }),

  // Tasks / Kanban
  getTasks: () => request<Task[]>('/api/tasks'),
  createTask: (task: Partial<Task>) => request<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(task)
  }),
  updateTask: (taskId: string, fields: Partial<Task>) => request<Task>(`/api/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(fields)
  }),
  addTaskComment: (taskId: string, content: string) => request<any>(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),
  toggleSubtask: (taskId: string, subtaskId: string) => request<Task>(`/api/tasks/${taskId}/subtasks/toggle`, {
    method: 'POST',
    body: JSON.stringify({ subtaskId })
  }),
  addSubtask: (taskId: string, title: string) => request<any>(`/api/tasks/${taskId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify({ title })
  }),

  // Diaries
  getDiaries: () => request<DiarioEntry[]>('/api/diaries'),
  createDiary: (diary: Partial<DiarioEntry>) => request<DiarioEntry>('/api/diaries', {
    method: 'POST',
    body: JSON.stringify(diary)
  }),

  // Timers (Chronometer)
  getTimers: () => request<TimeEntry[]>('/api/timers'),
  startTimer: (taskId?: string, projectId?: string, description?: string) => request<TimeEntry>('/api/timer/start', {
    method: 'POST',
    body: JSON.stringify({ taskId, projectId, description })
  }),
  pauseTimer: (timerId: string) => request<TimeEntry>('/api/timer/pause', {
    method: 'POST',
    body: JSON.stringify({ timerId })
  }),
  stopTimer: (timerId: string) => request<TimeEntry>('/api/timer/stop', {
    method: 'POST',
    body: JSON.stringify({ timerId })
  }),

  // Chat
  getChats: () => request<ChatMessage[]>('/api/chats'),
  sendChatMessage: (channel: string, content: string, attachments?: any[]) => request<ChatMessage>('/api/chats', {
    method: 'POST',
    body: JSON.stringify({ channel, content, attachments })
  }),

  // Calendar
  getEvents: () => request<CalendarEvent[]>('/api/calendar'),
  createEvent: (ev: Partial<CalendarEvent>) => request<CalendarEvent>('/api/calendar', {
    method: 'POST',
    body: JSON.stringify(ev)
  }),
  updateEvent: (id: string, ev: Partial<CalendarEvent>) => request<CalendarEvent>(`/api/calendar/${id}`, {
    method: 'PUT',
    body: JSON.stringify(ev)
  }),
  deleteEvent: (id: string) => request<any>(`/api/calendar/${id}`, {
    method: 'DELETE'
  }),
  summarizeMeeting: (data: { title: string; description: string; decisions: string; ataText: string; participantsNames: string[] }) => request<{ summary: string }>('/api/gemini/summarize-meeting', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  generateMeetingAutoTasks: (data: { eventId: string; projectId: string; title: string; decisions: string; participants: string[] }) => request<{ success: boolean; createdTasks: any[] }>('/api/gemini/auto-tasks', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Notifications
  getNotifications: () => request<Notification[]>('/api/notifications'),
  markNotificationsRead: () => request<{ success: boolean }>('/api/notifications/read', {
    method: 'POST'
  }),

  // Audit Logs
  getAuditLogs: () => request<AuditLog[]>('/api/logs'),
  getLogs: () => request<AuditLog[]>('/api/logs'),
  createAuditLog: (action: string, targetType: string, details: string) => request<any>('/api/logs', {
    method: 'POST',
    body: JSON.stringify({ action, targetType, details })
  }),
  simulateLogin: (userId: string) => {
    setStoredCurrentUser(userId);
  },

  // Dashboard calculations
  getDashboardSummary: () => request<any>('/api/dashboard-summary'),

  // ==========================================
  // RETRO COMPLETED - EXTENDED PLATFORM API
  // ==========================================

  // Meetings
  getMeetings: () => request<Meeting[]>('/api/meetings'),
  createMeeting: (meeting: Partial<Meeting>) => request<Meeting>('/api/meetings', {
    method: 'POST',
    body: JSON.stringify(meeting)
  }),

  // Pendencias Tracker (Issue Queue)
  getPendencias: () => request<Pendencia[]>('/api/pendencias'),
  createPendencia: (p: Partial<Pendencia>) => request<Pendencia>('/api/pendencias', {
    method: 'POST',
    body: JSON.stringify(p)
  }),
  updatePendencia: (id: string, fields: Partial<Pendencia>) => request<Pendencia>(`/api/pendencias/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields)
  }),
  addPendenciaHistory: (id: string, content: string) => request<Pendencia>(`/api/pendencias/${id}/history`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),

  // Chat Channels
  getChannels: () => request<ChatChannel[]>('/api/channels'),
  createChannel: (c: Partial<ChatChannel>) => request<ChatChannel>('/api/channels', {
    method: 'POST',
    body: JSON.stringify(c)
  }),

  // Knowledge Base (Central Operacional)
  getKnowledgeDocs: () => request<KnowledgeDoc[]>('/api/knowledge-docs'),
  createKnowledgeDoc: (doc: Partial<KnowledgeDoc>) => request<KnowledgeDoc>('/api/knowledge-docs', {
    method: 'POST',
    body: JSON.stringify(doc)
  }),
  updateKnowledgeDoc: (id: string, doc: Partial<KnowledgeDoc>) => request<KnowledgeDoc>(`/api/knowledge-docs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(doc)
  }),

  // Specialist Teams Custom
  getTeams: () => request<Team[]>('/api/teams'),
  createTeam: (team: Partial<Team>) => request<Team>('/api/teams', {
    method: 'POST',
    body: JSON.stringify(team)
  }),
  updateTeam: (id: string, team: Partial<Team>) => request<Team>(`/api/teams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(team)
  }),

  // ==========================================
  // GEMINI AI INTEGRATION
  // ==========================================
  
  // Resumo inteligente dos diários do bordo
  generateAiOperationalSummary: () => request<{ summary: string }>('/api/gemini/summarize-diaries', {
    method: 'POST'
  }),

  // Análise automática de prioridades e sugestão de subtarefas por IA baseado no título/descrição
  analyzeTaskPriorityWithAi: (title: string, description: string) => request<{
    priority: TaskPriority;
    explanation: string;
    suggestedSubtasks: string[];
  }>('/api/gemini/task-priority', {
    method: 'POST',
    body: JSON.stringify({ title, description })
  }),

  // Insights de produtividade geral da equipe
  generateAiProductivityInsights: () => request<{ insights: string[] }>('/api/gemini/productivity-insights', {
    method: 'POST'
  }),

  // IA para Gestão de Times: gera auditoria automatizada e inteligente do grupo
  generateAiTeamReport: (teamId: string) => request<{ report: string }>('/api/gemini/team-report', {
    method: 'POST',
    body: JSON.stringify({ teamId })
  }),

  // Chatbot de Inteligência: analisa projetos, pendências, etc. de canais
  generateAiChatQuery: (channelId: string, prompt: string) => request<{ response: string }>('/api/gemini/chat-query', {
    method: 'POST',
    body: JSON.stringify({ channelId, prompt })
  }),
  
  // Resumo Diário inteligente dos diários e metas
  generateAiDailyBrief: (userId?: string) => request<{ brief: string }>('/api/gemini/daily-brief', {
    method: 'POST',
    body: JSON.stringify({ userId })
  }),

  // Sumarização inteligente de reuniões e geração de plano de ação
  generateAiMeetingSummary: (meetingId: string) => request<{ summary: string }>('/api/gemini/meeting-summary', {
    method: 'POST',
    body: JSON.stringify({ meetingId })
  }),

  // Monitoramento operacional de riscos e pontuação de saúde do projeto
  generateAiRiskAlert: (projectId: string) => request<{ risks: string; healthScore: number }>('/api/gemini/risk-alert', {
    method: 'POST',
    body: JSON.stringify({ projectId })
  })
};
