import React, { useState, useEffect } from 'react';
import { AppApi } from '../services/api';
import { User, Project, Task, TaskStatus, TaskPriority, Subtask, Meeting, Pendencia, DiarioEntry, CalendarEvent, Comment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Calendar, Paperclip, AlertTriangle, MessageSquare, CheckSquare, 
  Trash, Sparkles, Send, ShieldAlert, X, ChevronRight, UserPlus, Tag, 
  ArrowRight, RefreshCw, Layers, Eye, CheckCircle2, Activity, Link, 
  FileText, Trash2, HelpCircle, Briefcase, AlertCircle, BookOpen, Clock, Check, Download, Info
} from 'lucide-react';

interface KanbanViewProps {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  tasks: Task[];
  onRefreshTasks: () => Promise<void>;
}

export default function KanbanView({ currentUser, users, projects, tasks, onRefreshTasks }: KanbanViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Create task fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Média');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  // AI suggest auxiliary states
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiDraft, setAiDraft] = useState<{ priority: TaskPriority, explanation: string, suggestedSubtasks: string[] } | null>(null);

  // Detail Modal Comments and subtasks
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Integrations state lists
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [diaries, setDiaries] = useState<DiarioEntry[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  // Active edit state for selected task inside modal
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('Backlog');
  const [editPriority, setEditPriority] = useState<TaskPriority>('Média');
  const [editProjectId, setEditProjectId] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editAssignees, setEditAssignees] = useState<string[]>([]);
  const [editObservers, setEditObservers] = useState<string[]>([]);
  const [editAttachments, setEditAttachments] = useState<{ name: string; size: string; url: string }[]>([]);
  const [editSubtasks, setEditSubtasks] = useState<Subtask[]>([]);
  
  // Linkages edit state
  const [editLinkedProjectId, setEditLinkedProjectId] = useState('');
  const [editLinkedDemandId, setEditLinkedDemandId] = useState('');
  const [editLinkedEventId, setEditLinkedEventId] = useState('');
  const [editLinkedMeetingId, setEditLinkedMeetingId] = useState('');
  const [editLinkedPendenciaId, setEditLinkedPendenciaId] = useState('');
  const [editLinkedDiarioId, setEditLinkedDiarioId] = useState('');

  // Local helper states
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedVirtualFile, setSelectedVirtualFile] = useState('');
  const [activeModalTab, setActiveModalTab] = useState<'info' | 'checklist' | 'team' | 'links' | 'comments_history'>('info');
  const [isSavingChanges, setIsSavingChanges] = useState(false);

  const virtualFileOptions = [
    { name: 'documento_requisitos_protheus_v1.pdf', size: '1.4 MB' },
    { name: 'query_ajuste_deadlocks.sql', size: '18 KB' },
    { name: 'log_erros_integrador_jadlog.txt', size: '420 KB' },
    { name: 'ata_alinhamento_tecnico_squad.docx', size: '1.1 MB' },
    { name: 'esquema_redirecionamento_wifi_fábrica.png', size: '1.8 MB' },
    { name: 'diagrama_banco_dados_producao.pdf', size: '3.2 MB' }
  ];

  // Fetch linked integrations when selected task is activated
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setLoadingIntegrations(true);
        const [m, p, d, e] = await Promise.all([
          AppApi.getMeetings().catch(() => []),
          AppApi.getPendencias().catch(() => []),
          AppApi.getDiaries().catch(() => []),
          AppApi.getEvents().catch(() => [])
        ]);
        setMeetings(m);
        setPendencias(p);
        setDiaries(d);
        setCalendarEvents(e);
      } catch (err) {
        console.error('Erro ao buscar integrações:', err);
      } finally {
        setLoadingIntegrations(false);
      }
    };
    fetchIntegrations();
  }, [selectedTask]);

  // Setup edit states when modal opens
  useEffect(() => {
    if (selectedTask) {
      setEditTitle(selectedTask.title || '');
      setEditDescription(selectedTask.description || '');
      setEditStatus(selectedTask.status || 'Backlog');
      setEditPriority(selectedTask.priority || 'Média');
      setEditProjectId(selectedTask.projectId || '');
      setEditDueDate(selectedTask.dueDate || '');
      
      setEditTags(selectedTask.tags || []);
      setEditAssignees(selectedTask.assignees || []);
      setEditObservers(selectedTask.observers || []);
      setEditAttachments(selectedTask.attachments || []);
      setEditSubtasks(selectedTask.subtasks || []);
      
      setEditLinkedProjectId(selectedTask.linkedProjectId || '');
      setEditLinkedDemandId(selectedTask.linkedDemandId || '');
      setEditLinkedEventId(selectedTask.linkedEventId || '');
      setEditLinkedMeetingId(selectedTask.linkedMeetingId || '');
      setEditLinkedPendenciaId(selectedTask.linkedPendenciaId || '');
      setEditLinkedDiarioId(selectedTask.linkedDiarioId || '');
      
      setActiveModalTab('info');
    }
  }, [selectedTask]);

  // Drag-and-drop helpers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const historyLog = {
        date: new Date().toISOString(),
        content: `Célula movida por arrastar para "${targetStatus}"`,
        userName: currentUser?.name || 'Sistema'
      };
      
      await AppApi.updateTask(taskId, { 
        status: targetStatus,
        history: [...(task.history || []), historyLog]
      });
      await onRefreshTasks();
    } catch (err) {
      console.error(err);
      alert('Erro ao mover status do card.');
    }
  };

  // Switch column manually
  const handleMoveStatus = async (taskId: string, targetStatus: TaskStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const historyLog = {
        date: new Date().toISOString(),
        content: `Mudou status para ${targetStatus}`,
        userName: currentUser?.name || 'Colega'
      };

      await AppApi.updateTask(taskId, { 
        status: targetStatus,
        history: [...(task?.history || []), historyLog]
      });
      await onRefreshTasks();
      if (selectedTask && selectedTask.id === taskId) {
        setEditStatus(targetStatus);
        setSelectedTask(prev => prev ? { 
          ...prev, 
          status: targetStatus,
          history: [...(prev.history || []), historyLog]
        } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI priority analyzer
  const handleAiAnalyzeDemand = async () => {
    if (!title.trim()) {
      alert('Por favor, digite um título de demanda antes de rodar o assistente de IA.');
      return;
    }
    try {
      setAiAnalyzing(true);
      setAiDraft(null);
      const res = await AppApi.analyzeTaskPriorityWithAi(title, description);
      setAiDraft(res);
      setPriority(res.priority); 
    } catch (err) {
      console.error(err);
      alert('Erro ao se conectar ao assistente de IA.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const subtaskList = aiDraft ? aiDraft.suggestedSubtasks : [];
      const formattedSubs = subtaskList.map((st, idx) => ({
        id: `s-${Date.now()}-${idx}`,
        title: st,
        completed: false
      }));

      const initialHistory = [
        {
          date: new Date().toISOString(),
          content: 'Card criado no Kanban Britânia',
          userName: currentUser?.name || 'Sistema'
        }
      ];

      await AppApi.createTask({
        title,
        description,
        priority,
        projectId: projectId || projects[0]?.id,
        assignees: assigneeId ? [assigneeId] : [],
        observers: [],
        dueDate: dueDate || new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
        tags: parsedTags,
        subtasks: formattedSubs as any,
        history: initialHistory,
        attachments: []
      });

      // Reset
      setTitle('');
      setDescription('');
      setPriority('Média');
      setTagsInput('');
      setAssigneeId('');
      setDueDate('');
      setAiDraft(null);
      setIsCreating(false);

      await onRefreshTasks();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar nova tarefa.');
    }
  };

  // Post comment
  const handlePostComment = async () => {
    if (!selectedTask || !newComment.trim()) return;
    try {
      const added = await AppApi.addTaskComment(selectedTask.id, newComment);
      const updatedComments = [...selectedTask.comments, {
        id: added.id,
        userId: currentUser?.id || 'u-1',
        userName: currentUser?.name || 'Analista',
        content: newComment,
        createdAt: new Date().toISOString()
      }];
      setSelectedTask(prev => prev ? { ...prev, comments: updatedComments } : null);
      setNewComment('');
      onRefreshTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // Checklist actions (inside edit states)
  const handleAddEditSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `s-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setEditSubtasks([...editSubtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleToggleEditSubtask = (subId: string) => {
    setEditSubtasks(editSubtasks.map(s => 
      s.id === subId ? { ...s, completed: !s.completed } : s
    ));
  };

  const handleRemoveEditSubtask = (subId: string) => {
    setEditSubtasks(editSubtasks.filter(s => s.id !== subId));
  };

  // Assignees & Observers togglers
  const toggleEditAssignee = (uId: string) => {
    if (editAssignees.includes(uId)) {
      setEditAssignees(editAssignees.filter(id => id !== uId));
    } else {
      setEditAssignees([...editAssignees, uId]);
    }
  };

  const toggleEditObserver = (uId: string) => {
    if (editObservers.includes(uId)) {
      setEditObservers(editObservers.filter(id => id !== uId));
    } else {
      setEditObservers([...editObservers, uId]);
    }
  };

  // Tag helper modifiers
  const handleAddTag = () => {
    const value = newTagInput.trim();
    if (value && !editTags.includes(value)) {
      setEditTags([...editTags, value]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(t => t !== tagToRemove));
  };

  // Attachment mock helpers
  const handleAddMockAttachment = () => {
    const option = virtualFileOptions.find(f => f.name === selectedVirtualFile);
    if (!option) return;

    const newAttach = {
      name: option.name,
      size: option.size,
      url: '#'
    };

    if (!editAttachments.some(a => a.name === option.name)) {
      setEditAttachments([...editAttachments, newAttach]);
    }
    setSelectedVirtualFile('');
  };

  const handleRemoveAttachment = (nameToRemove: string) => {
    setEditAttachments(editAttachments.filter(a => a.name !== nameToRemove));
  };

  // Save changes inside current opened task
  const handleSaveAllChanges = async () => {
    if (!selectedTask) return;
    setIsSavingChanges(true);
    try {
      const logsList: string[] = [];
      if (editTitle !== selectedTask.title) logsList.push(`alterou o título para "${editTitle}"`);
      if (editDescription !== selectedTask.description) logsList.push(`atualizou o detalhamento técnico`);
      if (editStatus !== selectedTask.status) logsList.push(`moveu para a etapa "${editStatus}"`);
      if (editPriority !== selectedTask.priority) logsList.push(`mudou a prioridade para "${editPriority}"`);
      if (editProjectId !== selectedTask.projectId) logsList.push(`revinculou para outro projeto principal`);
      if (editDueDate !== selectedTask.dueDate) logsList.push(`redefiniu o prazo limite para ${editDueDate}`);
      
      const addedAssignees = editAssignees.filter(id => !selectedTask.assignees.includes(id));
      const removedAssignees = selectedTask.assignees.filter(id => !editAssignees.includes(id));
      if (addedAssignees.length || removedAssignees.length) {
        logsList.push(`atualizou os responsáveis da equipe`);
      }

      const addedObservers = editObservers.filter(id => !(selectedTask.observers || []).includes(id));
      const removedObservers = (selectedTask.observers || []).filter(id => !editObservers.includes(id));
      if (addedObservers.length || removedObservers.length) {
        logsList.push(`alterou observadores acompanhantes`);
      }

      if (JSON.stringify(editTags) !== JSON.stringify(selectedTask.tags)) logsList.push(`atualizou etiquetas do chamado`);
      if (editAttachments.length !== (selectedTask.attachments || []).length) logsList.push(`atualizou documentos e anexos`);
      if (JSON.stringify(editSubtasks) !== JSON.stringify(selectedTask.subtasks)) logsList.push(`reorganizou itens do checklist operacional`);

      // Linkage changes checks
      if (editLinkedProjectId !== selectedTask.linkedProjectId) logsList.push(`atualizou vínculo de projeto alternativo`);
      if (editLinkedDemandId !== selectedTask.linkedDemandId) logsList.push(`atualizou vínculo de demanda relacionada`);
      if (editLinkedEventId !== selectedTask.linkedEventId) logsList.push(`atualizou vínculo de evento de prazo`);
      if (editLinkedMeetingId !== selectedTask.linkedMeetingId) logsList.push(`atualizou vínculo de reunião de alinhamento`);
      if (editLinkedPendenciaId !== selectedTask.linkedPendenciaId) logsList.push(`atualizou vínculo de pendência relacionada`);
      if (editLinkedDiarioId !== selectedTask.linkedDiarioId) logsList.push(`atualizou vínculo de diário operacional`);

      const newHistoryEntries = logsList.map(item => ({
        date: new Date().toISOString(),
        content: item,
        userName: currentUser?.name || 'Supervisor'
      }));

      const mergedHistory = [...(selectedTask.history || []), ...newHistoryEntries];

      const payload: Partial<Task> = {
        title: editTitle,
        description: editDescription,
        status: editStatus,
        priority: editPriority,
        projectId: editProjectId,
        dueDate: editDueDate || selectedTask.dueDate,
        tags: editTags,
        assignees: editAssignees,
        observers: editObservers,
        attachments: editAttachments,
        subtasks: editSubtasks,
        history: mergedHistory,

        linkedProjectId: editLinkedProjectId || undefined,
        linkedDemandId: editLinkedDemandId || undefined,
        linkedEventId: editLinkedEventId || undefined,
        linkedMeetingId: editLinkedMeetingId || undefined,
        linkedPendenciaId: editLinkedPendenciaId || undefined,
        linkedDiarioId: editLinkedDiarioId || undefined
      };

      const updated = await AppApi.updateTask(selectedTask.id, payload);
      setSelectedTask(updated);
      await onRefreshTasks();
      alert('Informações do Card Kanban atualizadas com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar modificações no card do Kanban.');
    } finally {
      setIsSavingChanges(false);
    }
  };

  // Setup Board Columns
  const columns: { label: string; status: TaskStatus; color: string }[] = [
    { label: 'Backlog', status: 'Backlog', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-350' },
    { label: 'A Fazer', status: 'A Fazer', color: 'bg-blue-50/50 text-blue-700 dark:bg-slate-900/30 dark:text-blue-300' },
    { label: 'Em Andamento', status: 'Em Andamento', color: 'bg-amber-50/50 text-amber-700 dark:bg-slate-900/30 dark:text-amber-300' },
    { label: 'Em Revisão', status: 'Em Revisão', color: 'bg-purple-50/50 text-purple-700 dark:bg-slate-900/30 dark:text-purple-300' },
    { label: 'Concluído', status: 'Concluído', color: 'bg-emerald-50/50 text-emerald-700 dark:bg-slate-900/30 dark:text-emerald-300' }
  ];

  // Helper labels for priority borders
  const priorityBorders: Record<TaskPriority, string> = {
    'Baixa': 'border-l-slate-300',
    'Média': 'border-l-blue-400',
    'Alta': 'border-l-amber-500',
    'Crítica': 'border-l-rose-500 animate-pulse'
  };

  // Priority Pill Colors
  const priorityLabels: Record<TaskPriority, string> = {
    'Baixa': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350',
    'Média': 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300',
    'Alta': 'bg-amber-50 text-amber-850 dark:bg-amber-950/20 dark:text-amber-400',
    'Crítica': 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450'
  };

  const canCreate = currentUser?.role !== 'Analista';

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="kanban-view-root">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Kanban de Demandas
            <Layers className="h-6 w-6 text-indigo-500" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gestão ágil integrada. Clique nos cards à direita para editar informações completas, checklist, múltiplos responsáveis, observadores, anexos virtuais e vínculos cooperativos.
          </p>
        </div>
        
        {canCreate && (
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="self-start md:self-auto flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {isCreating ? 'Fechar Painel' : 'Criar Nova Demanda'}
          </button>
        )}
      </div>

      {/* Form creation drawer */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-md space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Plus className="h-4 w-4 text-indigo-500" />
              Especificações do Novo Card
            </h3>

            <form onSubmit={handleCreateTaskSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Título do Card / Demanda *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Ex: Ajuste de query no banco ou Integração técnica"
                    className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:border-indigo-500 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAiAnalyzeDemand}
                    disabled={aiAnalyzing}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition-colors text-xs font-semibold cursor-pointer shrink-0"
                    title="Analisar demanda com IA"
                  >
                    <Sparkles className="h-3.5 w-3.5 fill-white animate-pulse" />
                    IA Prioridade
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Projeto Corporativo</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:border-indigo-500 dark:text-white cursor-pointer"
                >
                  <option value="">Selecionar Projeto</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Detalhamento Técnico / Requisitos</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instruções para o executor do chamado, referências técnicas..."
                  className="w-full text-xs h-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2 flex flex-col justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Designado / Responsável Inicial</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none focus:border-indigo-500 dark:text-white cursor-pointer"
                  >
                    <option value="">Nenhum designado</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vencimento</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Prioridade</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 outline-none dark:text-white cursor-pointer"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Crítica">Crítica</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* AI helper draft visualization */}
              {aiAnalyzing && (
                <div className="md:col-span-3 py-4 text-center bg-amber-50/40 border border-dashed border-amber-300 rounded-lg animate-pulse">
                  <RefreshCw className="h-4 w-4 text-amber-500 animate-spin mx-auto mb-1.5" />
                  <span className="text-xs font-bold text-amber-700">O Gemini está analisando riscos de dependência da demanda...</span>
                </div>
              )}

              {aiDraft && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="md:col-span-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-bold">
                    <Sparkles className="h-4 w-4 animate-bounce" />
                    <span>Sugestão de Distribuição por IA</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Análise</strong>: {aiDraft.explanation}
                  </p>
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-200 mb-1">Passos recomendados para este chamado (Injetados no Card):</strong>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 pl-4 list-disc text-slate-650 dark:text-slate-400">
                      {aiDraft.suggestedSubtasks.map((st, idx) => (
                        <li key={idx} className="leading-tight">{st}</li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}

              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Etiquetas / Tags (separar por vírgula)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="EX: SQL, Protheus, SLA"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white outline-none"
                />
              </div>

              <div className="md:col-span-3 pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs font-bold px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  Registrar Card no Kanban
                </button>
              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Kanban Board Layout Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.status);
          return (
            <div
              key={col.status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
              className="bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-900 p-3 h-full flex flex-col space-y-3 min-h-[600px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
                  <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 pr-1 truncate">{col.label}</h3>
                </div>
                <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[750px] pr-0.5 pb-8">
                {colTasks.map(task => {
                  const proj = projects.find(p => p.id === task.projectId);
                  const assigneesList = users.filter(u => task.assignees.includes(u.id));

                  // Is item delayed?
                  const isOverdue = new Date(task.dueDate).getTime() < Date.now() && task.status !== 'Concluído';

                  const totalSubs = task.subtasks?.length || 0;
                  const completedSubs = task.subtasks?.filter(s => s.completed).length || 0;
                  const progressPercentage = totalSubs > 0 ? Math.min(100, Math.round((completedSubs / totalSubs) * 100)) : 0;

                  // Assess integrations linked
                  const hasProjectLink = !!task.linkedProjectId;
                  const hasDemandLink = !!task.linkedDemandId;
                  const hasEventLink = !!task.linkedEventId;
                  const hasMeetingLink = !!task.linkedMeetingId;
                  const hasPendenciaLink = !!task.linkedPendenciaId;
                  const hasDiarioLink = !!task.linkedDiarioId;

                  const hasAnyLink = hasProjectLink || hasDemandLink || hasEventLink || hasMeetingLink || hasPendenciaLink || hasDiarioLink;

                  return (
                    <motion.div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e as any, task.id)}
                      onClick={() => setSelectedTask(task)}
                      className={`p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all border-l-4 ${
                        priorityBorders[task.priority]
                      } ${task.status === 'Concluído' ? 'opacity-75' : ''}`}
                    >
                      <div className="space-y-2.5">
                        
                        {/* Upper tag indicators */}
                        <div className="flex items-center justify-between gap-2.5">
                          <span 
                            className="text-[9px] font-extrabold px-1.5 py-0.5 rounded text-white tracking-wide truncate max-w-[120px]"
                            style={{ backgroundColor: proj?.color || '#3b82f6' }}
                            title={proj?.name}
                          >
                            {proj?.name || 'Geral'}
                          </span>
                          
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${priorityLabels[task.priority]}`}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Title & Desc */}
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight tracking-tight hover:text-indigo-600 dark:hover:text-indigo-400">
                          {task.title}
                        </h4>
                        
                        {task.description && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-snug">
                            {task.description}
                          </p>
                        )}

                        {/* Integrated items badges in the card itself */}
                        {hasAnyLink && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            <span className="text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-0.5 mr-1 pt-0.5">
                              <Link className="h-2.5 w-2.5" /> Vínculos:
                            </span>
                            {hasProjectLink && (
                              <span className="inline-flex items-center text-[9px] bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 px-1 rounded gap-0.5 font-semibold" title="Vínculo com Projeto">
                                <Briefcase className="h-2.5 w-2.5" /> Proj
                              </span>
                            )}
                            {hasDemandLink && (
                              <span className="inline-flex items-center text-[9px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 px-1 rounded gap-0.5 font-semibold" title="Vínculo com outra Demanda">
                                <Layers className="h-2.5 w-2.5" /> Demanda
                              </span>
                            )}
                            {hasEventLink && (
                              <span className="inline-flex items-center text-[9px] bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 px-1 rounded gap-0.5 font-semibold" title="Vínculo com Evento Calendário">
                                <Calendar className="h-2.5 w-2.5" /> Prazo
                              </span>
                            )}
                            {hasMeetingLink && (
                              <span className="inline-flex items-center text-[9px] bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 px-1 rounded gap-0.5 font-semibold" title="Vínculo com Reunião">
                                <VideoMeetingIcon className="h-2.5 w-2.5" /> Reunião
                              </span>
                            )}
                            {hasPendenciaLink && (
                              <span className="inline-flex items-center text-[9px] bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 px-1 rounded gap-0.5 font-semibold" title="Vínculo com Pendência de Setor">
                                <AlertCircle className="h-2.5 w-2.5" /> Pendência
                              </span>
                            )}
                            {hasDiarioLink && (
                              <span className="inline-flex items-center text-[9px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 px-1 rounded gap-0.5 font-semibold" title="Vínculo com Diário de Bordo">
                                <BookOpen className="h-2.5 w-2.5" /> Diário
                              </span>
                            )}
                          </div>
                        )}

                        {/* Interactive checklist progress bar */}
                        {totalSubs > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold">
                              <span className="flex items-center gap-0.5">
                                <CheckSquare className="h-2.5 w-2.5 text-indigo-500" /> Checklist
                              </span>
                              <span>{completedSubs}/{totalSubs} ({progressPercentage}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Tags visualization */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {task.tags.map((t, i) => (
                              <span key={i} className="text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Tag className="h-2.5 w-2.5 text-slate-400" /> {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer details row */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          
                          {/* Left stats info */}
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                            {task.comments.length > 0 && (
                              <div className="flex items-center gap-0.5" title="Comentários">
                                <MessageSquare className="h-3 w-3" />
                                <span>{task.comments.length}</span>
                              </div>
                            )}

                            {(task.attachments || []).length > 0 && (
                              <div className="flex items-center gap-0.5 text-indigo-500" title="Anexos do chamado">
                                <Paperclip className="h-3 w-3" />
                                <span className="text-[9px]">{(task.attachments || []).length}</span>
                              </div>
                            )}
                          </div>

                          {/* Multiple Assignees Avatars list */}
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {assigneesList.map(a => (
                              <img
                                key={a.id}
                                src={a.avatar}
                                alt={a.name}
                                referrerPolicy="no-referrer"
                                title={`${a.name} (${a.role})`}
                                className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                              />
                            ))}
                            {task.observers && task.observers.length > 0 && (
                              <div 
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 ring-2 ring-white dark:ring-slate-900 text-[8px] text-slate-500 font-bold"
                                title={`${task.observers.length} observadores acompanhando`}
                              >
                                <Eye className="h-2.5 w-2.5" />
                              </div>
                            )}
                            {assigneesList.length === 0 && (
                              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-[8px] text-slate-400" title="Sem executor definido">
                                Un.
                              </span>
                            )}
                          </div>

                        </div>

                        {/* Due date marker */}
                        <div className="flex items-center justify-between pt-1 text-[9px]">
                          <span className={`flex items-center gap-1 font-semibold ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                            <Calendar className="h-3 w-3" />
                            Vence: {task.dueDate}
                          </span>
                          {isOverdue && (
                            <span className="text-[8px] uppercase font-extrabold bg-rose-500 text-white rounded px-1 animate-pulse">
                              Atrasado
                            </span>
                          )}
                        </div>

                      </div>
                    </motion.div>
                  );
                })}
                
                {colTasks.length === 0 && (
                  <div className="py-12 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-850 rounded-lg">
                    Nenhum chamado no fluxo
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgraded Selected Task details Overlay Modal / Sidebar */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 180 }}
              className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full w-full max-w-xl flex flex-col shadow-2xl relative"
            >
              
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-full ${priorityLabels[editPriority]}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Controle Central do Chamado</h3>
                    <p className="text-[10px] text-slate-400">ID da Demanda: <span className="font-mono">{selectedTask.id}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full cursor-pointer"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* Struct Tabs Row */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto text-xs font-bold scrollbar-none">
                <button
                  onClick={() => setActiveModalTab('info')}
                  className={`flex-1 py-3 px-4 text-center border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeModalTab === 'info' 
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                      : 'border-transparent text-slate-450 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" /> Informações
                </button>
                <button
                  onClick={() => setActiveModalTab('checklist')}
                  className={`flex-1 py-3 px-4 text-center border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeModalTab === 'checklist' 
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                      : 'border-transparent text-slate-450 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <CheckSquare className="h-3.5 w-3.5" /> Checklist ({editSubtasks.length})
                </button>
                <button
                  onClick={() => setActiveModalTab('team')}
                  className={`flex-1 py-3 px-4 text-center border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeModalTab === 'team' 
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                      : 'border-transparent text-slate-450 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" /> Equipe ({editAssignees.length + editObservers.length})
                </button>
                <button
                  onClick={() => setActiveModalTab('links')}
                  className={`flex-1 py-3 px-4 text-center border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeModalTab === 'links' 
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                      : 'border-transparent text-slate-450 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Link className="h-3.5 w-3.5" /> Vínculos
                </button>
                <button
                  onClick={() => setActiveModalTab('comments_history')}
                  className={`flex-1 py-3 px-4 text-center border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeModalTab === 'comments_history' 
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                      : 'border-transparent text-slate-450 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" /> Histórico & Anexos ({editAttachments.length})
                </button>
              </div>

              {/* Scrollable Modal Content Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 dark:bg-slate-950/20">

                {/* TAB 1: GENERAL INFO */}
                {activeModalTab === 'info' && (
                  <div className="space-y-4">
                    
                    {/* Title input */}
                    <div className="space-y-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs">
                      <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Título do Card</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none focus:border-indigo-505 dark:text-white"
                      />
                    </div>

                    {/* Technical details textarea */}
                    <div className="space-y-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs">
                      <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Detalhamento Técnico / Requisitos</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full text-xs h-32 bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none focus:border-indigo-505 dark:text-white"
                        placeholder="Insira descrições do chamado cooperativo..."
                      />
                    </div>

                    {/* Metadata settings grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs space-y-1">
                        <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Etapa Atual</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                          className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none dark:text-white cursor-pointer"
                        >
                          {columns.map(c => (
                            <option key={c.status} value={c.status}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs space-y-1">
                        <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Complexidade / Prioridade</label>
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                          className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none dark:text-white cursor-pointer"
                        >
                          <option value="Baixa">Baixa</option>
                          <option value="Média">Média</option>
                          <option value="Alta">Alta</option>
                          <option value="Crítica">Crítica</option>
                        </select>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs space-y-1">
                        <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Projeto Vinculado</label>
                        <select
                          value={editProjectId}
                          onChange={(e) => setEditProjectId(e.target.value)}
                          className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none dark:text-white cursor-pointer"
                        >
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs space-y-1">
                        <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Prazo Estimado (Vencimento)</label>
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none dark:text-white"
                        />
                      </div>

                    </div>

                    {/* Tag modifier */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs space-y-3">
                      <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block pb-1 border-b">Gerenciamento de Etiquetas</label>
                      
                      <div className="flex flex-wrap gap-1.5 min-h-[30px] items-center">
                        {editTags.map((t, idx) => (
                          <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-705 dark:text-slate-300 rounded px-2.5 py-1 font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                            <Tag className="h-3 w-3 text-indigo-500" />
                            {t}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(t)}
                              className="text-slate-400 hover:text-rose-500 cursor-pointer text-[10px]"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                        {editTags.length === 0 && (
                          <span className="text-xs text-slate-400 italic">Nenhuma etiqueta inserida</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          placeholder="Nova Tag..."
                          className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none text-slate-900 dark:text-white"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded p-2 px-3 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Inserir
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 2: CHECKLIST & PROGRESS */}
                {activeModalTab === 'checklist' && (
                  <div className="space-y-4">
                    
                    {/* Progress Bar Container */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-350">
                        <span className="flex items-center gap-1">
                          <CheckSquare className="h-4 w-4 text-indigo-500" />
                          Progresso Operacional
                        </span>
                        <span>
                          {editSubtasks.filter(s => s.completed).length} de {editSubtasks.length} concluídos ({
                            editSubtasks.length > 0 
                              ? Math.min(100, Math.round((editSubtasks.filter(s => s.completed).length / editSubtasks.length) * 100)) 
                              : 0
                          }%)
                        </span>
                      </div>
                      
                      {/* Rich Tailwind progress bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${
                              editSubtasks.length > 0 
                                ? Math.min(100, Math.round((editSubtasks.filter(s => s.completed).length / editSubtasks.length) * 100)) 
                                : 0
                            }%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Interactive items list */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-2.5 min-h-[250px] flex flex-col justify-between">
                      
                      <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                        {editSubtasks.map((sub, i) => (
                          <div 
                            key={sub.id || i}
                            className="flex items-center justify-between py-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/35 px-1 rounded transition-colors"
                          >
                            <div 
                              onClick={() => handleToggleEditSubtask(sub.id)}
                              className="flex items-center gap-3 cursor-pointer flex-1"
                            >
                              <div className={`p-0.5 rounded border ${sub.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}>
                                <Check className="h-3.5 w-3.5" />
                              </div>
                              <span className={`text-xs ${sub.completed ? 'line-through text-slate-400 font-medium' : 'text-slate-700 dark:text-slate-200 font-semibold'}`}>
                                {sub.title}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveEditSubtask(sub.id)}
                              className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                              title="Remover etapa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}

                        {editSubtasks.length === 0 && (
                          <div className="py-12 text-center text-xs text-slate-400 italic">
                            Nenhum item adicionado ao checklist deste card.
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <input
                          type="text"
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          placeholder="Próxima meta ou teste operacional..."
                          className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none text-slate-900 dark:text-white"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEditSubtask())}
                        />
                        <button
                          type="button"
                          onClick={handleAddEditSubtask}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded p-2 px-4 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Adicionar
                        </button>
                      </div>

                    </div>

                  </div>
                )}

                {/* TAB 3: ASSIGNEES & OBSERVERS */}
                {activeModalTab === 'team' && (
                  <div className="space-y-4">
                    
                    {/* Multi select assignees */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Responsáveis da Equipe (Múltiplos)</label>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-650 px-2 py-0.5 rounded-full font-bold">
                          {editAssignees.length} selecionados
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto">
                        {users.map(u => {
                          const isAssigned = editAssignees.includes(u.id);
                          return (
                            <div
                              key={u.id}
                              onClick={() => toggleEditAssignee(u.id)}
                              className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                                isAssigned 
                                  ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-400' 
                                  : 'bg-slate-50/30 hover:bg-slate-100 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <img src={u.avatar} alt={u.name} className="h-6 w-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                                <div className="text-left">
                                  <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{u.name}</p>
                                  <p className="text-[9px] text-slate-400 font-medium leading-none">{u.role}</p>
                                </div>
                              </div>
                              <div className={`p-0.5 rounded-full ${isAssigned ? 'bg-indigo-600 text-white' : 'border border-slate-300 text-transparent'}`}>
                                <Check className="h-3 w-3" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Observers select */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5 text-indigo-500" />
                          Observadores & Acompanhantes do Chamado
                        </label>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-650 px-2 py-0.5 rounded-full font-bold">
                          {editObservers.length} observando
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto">
                        {users.map(u => {
                          const isObserver = editObservers.includes(u.id);
                          return (
                            <div
                              key={u.id}
                              onClick={() => toggleEditObserver(u.id)}
                              className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                                isObserver 
                                  ? 'bg-violet-50/50 dark:bg-violet-950/20 border-violet-400' 
                                  : 'bg-slate-50/30 hover:bg-slate-100 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <img src={u.avatar} alt={u.name} className="h-6 w-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                                <div className="text-left">
                                  <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{u.name}</p>
                                  <p className="text-[9px] text-slate-400 font-medium leading-none">{u.role}</p>
                                </div>
                              </div>
                              <div className={`p-0.5 rounded-full ${isObserver ? 'bg-violet-600 text-white' : 'border border-slate-300 text-transparent'}`}>
                                <Check className="h-3 w-3" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 4: ADVANCED CARDS VINCULOS */}
                {activeModalTab === 'links' && (
                  <div className="space-y-4">
                    
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl flex gap-2.5 text-xs text-slate-800 dark:text-amber-400">
                      <Info className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
                      <div>
                        <strong>Módulo de Conectividade Interna</strong>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                          Associe este card a outros fluxos operacionais para que o Gemini e a equipe tenham visibilidade do contexto cruzado na operação das fábricas da Britânia.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                      
                      {/* Projects bind option */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5 text-sky-500" />
                          Projeto Associado Principal
                        </label>
                        <select
                          value={editLinkedProjectId}
                          onChange={(e) => setEditLinkedProjectId(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none dark:text-white cursor-pointer"
                        >
                          <option value="">Nenhum vínculo</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sector})</option>
                          ))}
                        </select>
                      </div>

                      {/* Demand bind option */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1" title="Outra demanda do Kanban">
                          <Layers className="h-3.5 w-3.5 text-indigo-500" />
                          Demanda Relacionada (Kanban)
                        </label>
                        <select
                          value={editLinkedDemandId}
                          onChange={(e) => setEditLinkedDemandId(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none dark:text-white cursor-pointer"
                        >
                          <option value="">Nenhum vínculo</option>
                          {tasks
                            .filter(t => t.id !== selectedTask.id)
                            .map(t => (
                              <option key={t.id} value={t.id}>{t.title} [{t.status}]</option>
                            ))}
                        </select>
                      </div>

                      {/* Calendar event bind option */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-rose-500" />
                          Evento de Prazo (Calendário)
                        </label>
                        <select
                          value={editLinkedEventId}
                          onChange={(e) => setEditLinkedEventId(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none dark:text-white cursor-pointer"
                        >
                          <option value="">Nenhum vínculo</option>
                          {calendarEvents.map(e => (
                            <option key={e.id} value={e.id}>{e.title} - Data: {new Date(e.start).toLocaleDateString()}</option>
                          ))}
                        </select>
                      </div>

                      {/* Meetings bind option */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <VideoMeetingIcon className="h-3.5 w-3.5 text-teal-500" />
                          Ata de Reunião e Decisões
                        </label>
                        <select
                          value={editLinkedMeetingId}
                          onChange={(e) => setEditLinkedMeetingId(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none dark:text-white cursor-pointer"
                        >
                          <option value="">Nenhum vínculo</option>
                          {meetings.map(m => (
                            <option key={m.id} value={m.id}>{m.title} ({m.date})</option>
                          ))}
                        </select>
                      </div>

                      {/* Pendencias bind option */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                          Pendência do Setor Imposta
                        </label>
                        <select
                          value={editLinkedPendenciaId}
                          onChange={(e) => setEditLinkedPendenciaId(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none dark:text-white cursor-pointer"
                        >
                          <option value="">Nenhum vínculo</option>
                          {pendencias.map(p => (
                            <option key={p.id} value={p.id}>{p.title} ({p.status}) - {p.sectorResponsible}</option>
                          ))}
                        </select>
                      </div>

                      {/* Diaries bind option */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                          Diário de Bordo Correspondente
                        </label>
                        <select
                          value={editLinkedDiarioId}
                          onChange={(e) => setEditLinkedDiarioId(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none dark:text-white cursor-pointer"
                        >
                          <option value="">Nenhum vínculo</option>
                          {diaries.map(d => (
                            <option key={d.id} value={d.id}>{d.userName} - {d.projectName} ({d.date})</option>
                          ))}
                        </select>
                      </div>

                    </div>

                  </div>
                )}

                {/* TAB 5: HISTORY, ATTACHMENTS & COMMENTS ACTIVITY */}
                {activeModalTab === 'comments_history' && (
                  <div className="space-y-5">
                    
                    {/* Attachments Section */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-3">
                      <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block pb-1 border-b flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5 text-indigo-500" />
                        Anexos e Manuais Técnicos ({editAttachments.length})
                      </label>
                      
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                        {editAttachments.map((a, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-850 rounded border dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                              <div className="truncate">
                                <p className="font-bold truncate max-w-[200px]" title={a.name}>{a.name}</p>
                                <p className="text-[9px] text-slate-405">{a.size}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => alert('Download do anexo simulado com sucesso!')}
                                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title="Baixar anexo"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(a.name)}
                                className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {editAttachments.length === 0 && (
                          <div className="py-8 text-center text-xs text-slate-405 italic">
                            Nenhum arquivo ou especificação anexada.
                          </div>
                        )}
                      </div>

                      {/* Dropzone mock uploader */}
                      <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center bg-slate-50/20">
                        <p className="text-[10px] text-slate-405 font-bold mb-2">Simular o Envio de Documentação Britânia:</p>
                        <div className="flex gap-1.5">
                          <select
                            value={selectedVirtualFile}
                            onChange={(e) => setSelectedVirtualFile(e.target.value)}
                            className="flex-1 text-[11px] bg-white dark:bg-slate-800 border rounded p-1 outline-none dark:text-white"
                          >
                            <option value="">-- Escolher Arquivo Virtual --</option>
                            {virtualFileOptions.map((opt, i) => (
                              <option key={i} value={opt.name}>{opt.name} ({opt.size})</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleAddMockAttachment}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-2.5 text-xs font-bold shrink-0 cursor-pointer"
                          >
                            Anexar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Change History audit trail log */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-3">
                      <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block pb-1 border-b flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5 text-indigo-500" />
                        Histórico de Auditoria do Card ({selectedTask.history?.length || 0})
                      </label>

                      <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                        {(selectedTask.history || []).map((entry, idx) => (
                          <div key={idx} className="text-[10px] leading-relaxed border-l-2 border-indigo-500/30 pl-2.5 pb-2">
                            <span className="font-extrabold text-slate-805 dark:text-slate-200">{entry.userName}</span>{' '}
                            <span className="text-slate-600 dark:text-slate-400">{entry.content}</span>
                            <p className="text-[8px] text-slate-400 font-mono">{new Date(entry.date).toLocaleString()}</p>
                          </div>
                        ))}

                        {(!selectedTask.history || selectedTask.history.length === 0) && (
                          <div className="py-6 text-center text-xs text-slate-405 italic">
                            Nenhum log gravado neste chamado ainda
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Team Comments Thread */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-3">
                      <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block pb-1 border-b flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                        Discussão do Chamado ({selectedTask.comments?.length || 0})
                      </label>

                      <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                        {(selectedTask.comments || []).map(comm => (
                          <div key={comm.id} className="bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-lg border dark:border-slate-850">
                            <div className="flex justify-between text-[10px] text-slate-450 font-bold mb-1">
                              <span>{comm.userName}</span>
                              <span className="font-mono">{new Date(comm.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">{comm.content}</p>
                          </div>
                        ))}

                        {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                          <div className="py-6 text-center text-xs text-slate-405 italic">
                            Sem comentários adicionados.
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1.5 pt-2 border-t border-slate-50 dark:border-slate-850">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Escreva uma observação de progresso..."
                          className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded p-2 outline-none text-slate-900 dark:text-white"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePostComment())}
                        />
                        <button
                          type="button"
                          onClick={handlePostComment}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded p-2 px-3 text-xs font-semibold shrink-0 cursor-pointer"
                        >
                          Comentar
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="text-xs font-bold px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-300/80 rounded-lg cursor-pointer"
                >
                  Voltar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAllChanges}
                    disabled={isSavingChanges}
                    className="flex items-center gap-1.5 text-xs font-extrabold px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    {isSavingChanges ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Inline support component for calendar link icons
function VideoMeetingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m16 13 5.223-3.482a.5.5 0 0 0-.223-.858H16" />
      <rect width="14" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}
