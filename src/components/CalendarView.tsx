import React, { useState, useEffect } from 'react';
import { AppApi } from '../services/api';
import { User, Project, CalendarEvent, Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, Clock, Plus, Tag, HelpCircle, 
  MapPin, CheckSquare, X, ChevronLeft, ChevronRight, Activity, Bell, CalendarDays,
  UserPlus, FileText, Trash2, Edit, Sparkles, Brain, ExternalLink, AlertCircle, Users,
  Layers, Send, Copy, AlertTriangle, Check
} from 'lucide-react';
import Markdown from 'react-markdown';

interface CalendarViewProps {
  currentUser: User | null;
  projects: Project[];
  onRefreshEvents: () => Promise<void>;
  events: CalendarEvent[];
  users: User[];
  tasks: Task[];
}

export default function CalendarView({ 
  currentUser, 
  projects, 
  onRefreshEvents, 
  events,
  users = [],
  tasks = []
}: CalendarViewProps) {
  // Calendar Navigations
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 27)); // Seeded May 2026
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Drag-and-drop state helper
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  // Form fields for Creation/Editing
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [category, setCategory] = useState<'Reunião' | 'Manutenção' | 'Prazo' | 'Entrega' | 'Escala' | 'Outros'>('Reunião');
  const [color, setColor] = useState('#3b82f6');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [ataText, setAtaText] = useState('');
  const [decisions, setDecisions] = useState('');
  const [generateTasksAutomatically, setGenerateTasksAutomatically] = useState(false);

  // Category Filter criterion
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // AI Generated Results states
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const categories = ['Reunião', 'Manutenção', 'Prazo', 'Entrega', 'Escala', 'Outros'];

  // Colors dictionary mapping
  const categoryColors: Record<string, string> = {
    'Reunião': '#3b82f6',     // Blue
    'Manutenção': '#ef4444',  // Red
    'Prazo': '#f59e0b',       // Amber
    'Entrega': '#10b981',     // Green
    'Escala': '#8b5cf6',      // Purple
    'Outros': '#6b7280'       // Gray
  };

  // Keep color synced with category in creation flow
  useEffect(() => {
    if (!isEditing) {
      setColor(categoryColors[category]);
    }
  }, [category, isEditing]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
  };

  // Fill form fields when starting to edit
  const startEditingEvent = (ev: CalendarEvent) => {
    setTitle(ev.title || '');
    setDescription(ev.description || '');
    
    // Format dates back for datetime-local
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatDateTimeLocal = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setStart(formatDateTimeLocal(ev.start));
    setEnd(formatDateTimeLocal(ev.end));
    setCategory(ev.category || 'Reunião');
    setColor(ev.color || '#3b82f6');
    setSelectedProject(ev.projectId || '');
    setSelectedTask(ev.taskId || '');
    setSelectedParticipants(ev.participants || []);
    setAtaText(ev.ataText || '');
    setDecisions(ev.decisions || '');
    setGenerateTasksAutomatically(!!ev.generateTasksAutomatically);

    setIsEditing(true);
    setAiSummary('');
  };

  // Prepare fields for fresh creation
  const handleOpenCreateForm = () => {
    setTitle('');
    setDescription('');
    setStart('');
    setEnd('');
    setCategory('Reunião');
    setColor('#3b82f6');
    setSelectedProject('');
    setSelectedTask('');
    setSelectedParticipants([]);
    setAtaText('');
    setDecisions('');
    setGenerateTasksAutomatically(false);
    
    setIsScheduling(true);
  };

  // Create event submission
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !start) {
      showToast('Título e data de início são campos obrigatórios.', 'error');
      return;
    }

    try {
      const startIso = new Date(start).toISOString();
      const endIso = end ? new Date(end).toISOString() : new Date(new Date(start).getTime() + 3600 * 1000).toISOString();

      await AppApi.createEvent({
        title,
        description,
        start: startIso,
        end: endIso,
        category,
        color,
        projectId: selectedProject || undefined,
        taskId: selectedTask || undefined,
        participants: selectedParticipants,
        ataText,
        decisions,
        generateTasksAutomatically
      });

      showToast(`Evento "${title}" agendado com sucesso!`, 'success');
      setIsScheduling(false);
      await onRefreshEvents();
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao agendar compromisso operacional.', 'error');
    }
  };

  // Update existing event from details modal Edit form
  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;
    if (!title.trim() || !start) {
      showToast('Preencha os campos obrigatórios primeiro.', 'error');
      return;
    }

    try {
      const startIso = new Date(start).toISOString();
      const endIso = end ? new Date(end).toISOString() : new Date(new Date(start).getTime() + 3600 * 1000).toISOString();

      const updated = await AppApi.updateEvent(selectedEvent.id, {
        title,
        description,
        start: startIso,
        end: endIso,
        category,
        color,
        projectId: selectedProject || undefined,
        taskId: selectedTask || undefined,
        participants: selectedParticipants,
        ataText,
        decisions,
        generateTasksAutomatically
      });

      showToast(`Evento "${title}" atualizado com sucesso!`, 'success');
      setSelectedEvent(updated);
      setIsEditing(false);
      await onRefreshEvents();
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao atualizar agendamento operacional.', 'error');
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Deseja realmente remover permanentemente este compromisso operational?')) {
      return;
    }

    try {
      await AppApi.deleteEvent(eventId);
      showToast('Compromisso operacional apagado com êxito.', 'info');
      setSelectedEvent(null);
      setIsEditing(false);
      await onRefreshEvents();
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao excluir o compromisso.', 'error');
    }
  };

  // Simulate notification alerts trigger prior to event
  const triggerPreEventMockAlert = (event: CalendarEvent) => {
    const participantNamesList = (event.participants || [])
      .map(id => users.find(u => u.id === id)?.name || id)
      .filter(Boolean);

    const namesText = participantNamesList.length > 0
      ? `Participantes convidados (${participantNamesList.join(', ')}) foram notificados.`
      : 'Toda a equipe corporativa de plantão recebeu o aviso operacional.';

    showToast(`🔔 Alerta disparado para "${event.title}"! ${namesText}`, 'info');
  };

  // Trigger Gemini AI meeting Summarizer
  const handleGenerateAISummary = async (event: CalendarEvent) => {
    setIsGeneratingSummary(true);
    setAiSummary('');

    const names = (event.participants || []).map(id => users.find(u => u.id === id)?.name || id);

    try {
      const res = await AppApi.summarizeMeeting({
        title: event.title,
        description: event.description || '',
        decisions: event.decisions || decisions || '',
        ataText: event.ataText || ataText || '',
        participantsNames: names
      });

      setAiSummary(res.summary);
      showToast('Ata inteligente gerada de modo impecável pela IA corporativa.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Incompatibilidade temporária ao consultar o modelo Gemini.', 'error');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Trigger Gemini AI auto tasks extractor insertion in Kanban board
  const handleGenerateAITasks = async (event: CalendarEvent) => {
    setIsGeneratingTasks(true);

    try {
      const res = await AppApi.generateMeetingAutoTasks({
        eventId: event.id,
        projectId: event.projectId || selectedProject || 'proj-1',
        title: event.title,
        decisions: event.decisions || decisions || 'Ajustar log operacional',
        participants: event.participants || selectedParticipants
      });

      showToast('IA extraiu as decisões. Tarefas injetadas diretamente no Kanban!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao extrair e gerar tarefas de forma inteligente.', 'error');
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  // Toggle checklist participants handler
  const handleToggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  // DRAG AND DROP HANDLERS
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    setDraggedEventId(eventId);
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropEvent = async (e: React.DragEvent, targetYear: number, targetMonth: number, targetDay: number) => {
    e.preventDefault();
    setDragOverDay(null);
    const eventId = e.dataTransfer.getData('text/plain') || draggedEventId;
    if (!eventId) return;

    const event = events.find(ev => ev.id === eventId);
    if (!event) return;

    // Preserving current hours & minutes of the event
    const currentStart = new Date(event.start);
    const currentEnd = new Date(event.end);
    const durationMs = currentEnd.getTime() - currentStart.getTime();

    // Create new date using target date coordinates
    const newStart = new Date(targetYear, targetMonth, targetDay, currentStart.getHours(), currentStart.getMinutes());
    const newEnd = new Date(newStart.getTime() + durationMs);

    try {
      const updated = await AppApi.updateEvent(eventId, {
        start: newStart.toISOString(),
        end: newEnd.toISOString()
      });
      showToast(`Evento "${event.title}" reagendado para o dia ${targetDay} de ${monthsBr[targetMonth]}.`, 'info');
      await onRefreshEvents();
      // Synchronize details overlay if currently opened
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent(updated);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao atualizar posicionamento de data do evento.', 'error');
    } finally {
      setDraggedEventId(null);
    }
  };

  // Calendar render indicators helper
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const monthsBr = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Grid coordinates list builder
  const calendarDaysList: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDaysList.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDaysList.push(i);
  }

  // Filter criteria events
  const filteredEvents = activeCategory === 'all'
    ? events
    : events.filter(e => e.category === activeCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 relative" id="calendar-view-root">
      
      {/* Toast Notification HUD */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border text-xs font-semibold ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-800'
                : toastMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/90 dark:text-rose-300 dark:border-rose-800'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/90 dark:text-indigo-300 dark:border-indigo-800'
            }`}
          >
            {toastMessage.type === 'success' && <Check className="h-4.5 w-4.5 shrink-0" />}
            {toastMessage.type === 'error' && <AlertTriangle className="h-4.5 w-4.5 shrink-0" />}
            {toastMessage.type === 'info' && <Bell className="h-4.5 w-4.5 shrink-0" />}
            <span className="leading-normal">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upper Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Calendário Operacional & Reuniões
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Planejamento corporativo integrado. Planeje reuniões de pauta, registre participantes, gere ATAs automáticas e vincule demandas em tempo real.
          </p>
        </div>
        
        <button
          onClick={handleOpenCreateForm}
          className="self-start md:self-auto flex items-center gap-2 text-xs font-bold px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Agendar Compromisso
        </button>
      </div>

      {/* Filter Tabs & Visual Legend Row */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-full md:max-w-2xl">
          <button
            onClick={() => setActiveCategory('all')}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all active:scale-95 cursor-pointer ${
              activeCategory === 'all' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700' 
                : 'text-slate-500 hover:text-slate-755 hover:bg-slate-200/40'
            }`}
          >
            Todos Eventos
          </button>
          {categories.map(cat => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                  isSelected 
                    ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700' 
                    : 'text-slate-500 hover:text-slate-755 hover:bg-slate-200/40'
                }`}
                style={{ color: isSelected ? categoryColors[cat] : undefined }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categoryColors[cat] }} />
                {cat}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
          <Sparkles className="h-3 w-3 text-violet-500 animate-pulse" />
          <span>Arraste os cartões no calendário para reprogramar instantaneamente</span>
        </div>
      </div>

      {/* Booking and Editing Inline Canvas */}
      <AnimatePresence>
        {isScheduling && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="h-4.5 w-4.5 text-indigo-600" />
                Novo Agendamento Operacional & Decisões
              </h3>
              <button 
                onClick={() => setIsScheduling(false)} 
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Título do Compromisso *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="EX: Reunião Geral de Staff ou Entrega de Homologação"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-lg p-2.5 outline-none focus:border-indigo-500 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-lg p-2.5 outline-none focus:border-indigo-500 dark:text-white cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Início *</label>
                    <input
                      type="datetime-local"
                      value={start}
                      required
                      onChange={(e) => setStart(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-lg p-2 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Término</label>
                    <input
                      type="datetime-local"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-lg p-2 outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Layers className="h-3 w-3 text-indigo-400" />
                    Vincular Projeto
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-lg p-2.5 outline-none focus:border-indigo-500 dark:text-white cursor-pointer"
                  >
                    <option value="">Não Vinculado</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <CheckSquare className="h-3 w-3 text-rose-400" />
                    Vincular Demanda / Ticket
                  </label>
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-lg p-2.5 outline-none focus:border-indigo-500 dark:text-white cursor-pointer"
                  >
                    <option value="">Não Vinculado</option>
                    {tasks.map(task => (
                      <option key={task.id} value={task.id}>[{task.status}] {task.title.substring(0, 40)}...</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Cor Customizada
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-lg p-1">
                    <input 
                      type="color" 
                      value={color}
                      onChange={(e) => setColor(e.target.value)} 
                      className="w-8 h-8 rounded border-0 cursor-pointer" 
                    />
                    <span className="text-[10px] font-mono text-slate-450 uppercase">{color}</span>
                  </div>
                </div>

              </div>

              {/* Extended Meeting Participants Grid */}
              <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="h-4 w-4" />
                  Membros Participantes Convidados (Fila de Notificação Automática)
                </span>
                <p className="text-[10px] text-slate-400">
                  Todos os membros ativados receberão alertas imediatos em seus canais de notificações operacionais.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                  {users.map(u => {
                    const isSelected = selectedParticipants.includes(u.id);
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => handleToggleParticipant(u.id)}
                        className={`p-2 rounded-lg border text-[11px] font-medium flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-850 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 font-bold' 
                            : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? '#4f46e5' : '#cbd5e1' }} />
                        <span className="truncate">{u.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description and notes block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Pauta / Escopo do Compromisso
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Especifique com riqueza de detalhes os tópicos a serem analisados..."
                    className="w-full text-xs h-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-lg p-2.5 outline-none focus:border-indigo-500 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <CheckSquare className="h-4 w-4 text-emerald-500" />
                    Decisões & ATA Inicial (Se aplicável)
                  </label>
                  <textarea
                    value={decisions}
                    onChange={(e) => setDecisions(e.target.value)}
                    placeholder="Se este evento já ocorreu, registre acordos ou decisões tomadas para disparar tarefas automáticas..."
                    className="w-full text-xs h-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-710 rounded-lg p-2.5 outline-none focus:border-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Auto task generation trigger */}
              <div className="flex items-center gap-2 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                <input
                  type="checkbox"
                  id="auto-tasks-creation"
                  checked={generateTasksAutomatically}
                  onChange={(e) => setGenerateTasksAutomatically(e.target.checked)}
                  className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="auto-tasks-creation" className="text-xs text-indigo-950 dark:text-indigo-300 font-bold cursor-pointer">
                  Mapear e Gerar Tarefas de Ação no Kanban automaticamente
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScheduling(false)}
                  className="text-xs font-bold px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  Confirmar Agendamento
                </button>
              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double Column Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Hand: Interactive Monthly Grid System */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs lg:col-span-2">
          
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-500" />
              {monthsBr[month]} de {year}
            </h3>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 text-slate-500" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
              >
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-[10px] mb-2 uppercase select-none tracking-wider">
            <span>D</span>
            <span>S</span>
            <span>T</span>
            <span>Q</span>
            <span>Q</span>
            <span>S</span>
            <span>S</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {calendarDaysList.map((day, idx) => {
              if (day === null) {
                return <div key={idx} className="aspect-square bg-slate-50/10 dark:bg-slate-950/10 rounded opacity-25 select-none" />;
              }

              // Event filtering for target cell coordinates
              const dayEvents = filteredEvents.filter(ev => {
                const startD = new Date(ev.start);
                return startD.getFullYear() === year && startD.getMonth() === month && startD.getDate() === day;
              });

              const isToday = year === 2026 && month === 4 && day === 27;
              const hasEvents = dayEvents.length > 0;
              const isOverThisDay = dragOverDay === day;

              return (
                <div
                  key={idx}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverDay !== day) setDragOverDay(day);
                  }}
                  onDragLeave={() => {
                    if (dragOverDay === day) setDragOverDay(null);
                  }}
                  onDrop={(e) => handleDropEvent(e, year, month, day)}
                  className={`aspect-square p-1 border rounded-lg flex flex-col justify-between items-stretch transition-all select-none relative ${
                    isOverThisDay 
                      ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 scale-95 ring-2 ring-indigo-400' 
                      : isToday 
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 dark:ring-indigo-455/30 bg-indigo-50/5 dark:bg-indigo-950/5 font-black'
                      : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  onClick={() => {
                    if (hasEvents) {
                      setSelectedEvent(dayEvents[0]);
                    } else {
                      // Fill start day coordinate on empty day click to quicken create
                      const pad = (n: number) => n.toString().padStart(2, '0');
                      const startDefault = `${year}-${pad(month+1)}-${pad(day)}T09:00`;
                      setStart(startDefault);
                      setIsScheduling(true);
                      showToast(`Iniciando agendamento para o dia ${day} de ${monthsBr[month]}`, 'info');
                    }
                  }}
                >
                  <span className={`text-[10px] font-bold ${
                    isToday ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-600 dark:text-slate-450'
                  }`}>
                    {day}
                  </span>

                  {/* Micro list of events inside coordinates cell */}
                  <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleDragStart(e, ev.id);
                        }}
                        onDragOver={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className="h-4 rounded text-[8.5px] font-semibold truncate leading-none px-1 py-0.5 text-white shadow-xs active:opacity-70 cursor-grab flex items-center justify-between pointer-events-auto"
                        style={{ backgroundColor: ev.color }}
                        title={`${ev.title} (Arraste para mover)`}
                      >
                        <span className="truncate flex-1">{ev.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[7.5px] font-bold text-indigo-500 block leading-tight text-right pr-0.5">
                        +{dayEvents.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Hand: Corporate Detailed Agenda List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
              <Activity className="h-5 w-5 text-indigo-500" />
              Agenda Operacional do Mês
            </h3>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 font-bold px-2 py-0.5 rounded-full text-slate-500">
              {filteredEvents.length} eventos
            </span>
          </div>

          <div className="space-y-3.5 max-h-[465px] overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <div className="py-24 text-center text-slate-400 text-xs">
                Nenhum agendamento mapeado na categoria selecionada.
              </div>
            ) : (
              [...filteredEvents]
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .map(ev => {
                  const startDate = new Date(ev.start);
                  const isOver = startDate.getTime() < Date.now();
                  const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 'h';
                  const dateStr = startDate.toLocaleDateString([], { day: '2-digit', month: 'short' });

                  // Project meta link resolve
                  const linkedProj = projects.find(p => p.id === ev.projectId);

                  return (
                    <div
                      key={ev.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ev.id)}
                      onClick={() => setSelectedEvent(ev)}
                      className={`p-3 bg-slate-50/50 dark:bg-slate-950/20 border-l-4 rounded-r-lg hover:bg-slate-100/60 dark:hover:bg-slate-950/40 transition-all cursor-pointer relative overflow-hidden flex flex-col gap-2 border-y border-r border-slate-100 dark:border-slate-850/40 select-none ${
                        isOver ? 'opacity-70 border-dashed' : ''
                      }`}
                      style={{ borderLeftColor: ev.color }}
                      title="Clique para abrir detalhes. Arraste para reposicionar dia."
                    >
                      <div className="flex gap-2 justify-between items-start">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1 pb-0.5">
                            <span className="inline-block px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold text-white uppercase" style={{ backgroundColor: ev.color }}>
                              {ev.category}
                            </span>
                            {linkedProj && (
                              <span className="inline-block bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 px-1 py-0.5 rounded text-[8.5px] font-semibold limit-width truncate">
                                📁 {linkedProj.name}
                              </span>
                            )}
                          </div>
                          
                          <h4 className="text-xs font-bold text-slate-850 dark:text-white leading-tight pr-1 truncate">
                            {ev.title}
                          </h4>
                          
                          {ev.description && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-snug">
                              {ev.description}
                            </p>
                          )}
                          
                          <span className="text-[9.5px] font-semibold text-slate-650 dark:text-slate-400 flex items-center gap-1 pt-0.5">
                            <Clock className="h-3 w-3" />
                            {timeStr}
                          </span>
                        </div>

                        <div className="text-right flex flex-col items-center shrink-0">
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-display uppercase tracking-wider block">
                            {dateStr}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>

      {/* Selected Event details and dynamic actions overlay Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              
              {/* Modal Top bar color match */}
              <div 
                className="p-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center" 
                style={{ borderLeft: `6px solid ${selectedEvent.color}` }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase rounded-full px-2 py-0.5 text-white mr-1.5" style={{ backgroundColor: selectedEvent.color }}>
                    {selectedEvent.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" /> Evento ID: {selectedEvent.id}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    setIsEditing(false);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body Scroll Container */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                
                {/* Switch view logic: Standard Review VS Edit flow */}
                {!isEditing ? (
                  <div className="space-y-4">
                    
                    {/* Header values */}
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-lg md:text-xl leading-snug">
                        {selectedEvent.title}
                      </h3>
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1.5 pt-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          {new Date(selectedEvent.start).toLocaleString('pt-BR', { dateStyle: 'long' })}
                        </span>
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>
                          {new Date(selectedEvent.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h às {new Date(selectedEvent.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}hs
                        </span>
                      </div>
                    </div>

                    {/* Description Paragraph */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                        Pauta & Escopo Principal
                      </span>
                      <p className="text-xs text-slate-750 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-100 dark:border-slate-850/60 leading-relaxed">
                        {selectedEvent.description || 'Nenhum detalhe adicional de pauta cadastrado para este evento corporativo.'}
                      </p>
                    </div>

                    {/* Linked project & task indicators */}
                    {(selectedEvent.projectId || selectedEvent.taskId) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                        {selectedEvent.projectId && (
                          <div className="p-2.5 bg-indigo-50/25 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/40 rounded-lg flex flex-col gap-1">
                            <span className="text-[8.5px] font-bold text-indigo-500 uppercase">📁 Projeto Vinculado</span>
                            <span className="text-[11px] font-extrabold text-slate-850 dark:text-indigo-300">
                              {projects.find(p => p.id === selectedEvent.projectId)?.name || 'Projeto Não Localizado'}
                            </span>
                          </div>
                        )}
                        {selectedEvent.taskId && (
                          <div className="p-2.5 bg-rose-50/25 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/40 rounded-lg flex flex-col gap-1">
                            <span className="text-[8.5px] font-bold text-rose-500 uppercase">🎟️ Demanda Kanban Corporativa</span>
                            <span className="text-[11px] font-extrabold text-slate-855 dark:text-rose-300 truncate">
                              [{tasks.find(t => t.id === selectedEvent.taskId)?.status || 'Não Iniciado'}] {tasks.find(t => t.id === selectedEvent.taskId)?.title || 'Demanda Vinculada'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Participants checklist view */}
                    {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                      <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                          Profissionais de Plantão & Participantes ({selectedEvent.participants.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedEvent.participants.map(pId => {
                            const matchedUser = users.find(u => u.id === pId);
                            return (
                              <div 
                                key={pId}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold flex items-center gap-1.5 shadow-2xs"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>{matchedUser ? matchedUser.name : pId}</span>
                                {matchedUser?.role && (
                                  <span className="text-[8.5px] text-slate-400 font-medium">({matchedUser.role})</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action Items ATA Text details / Decisions summary block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">Anotações de ATA</span>
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-lg text-xs leading-relaxed max-h-36 overflow-y-auto">
                          {selectedEvent.ataText || <em className="text-slate-400">Nenhuma anotação de ATA registrada.</em>}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">Decisões Mapeadas</span>
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-lg text-xs leading-relaxed max-h-36 overflow-y-auto">
                          {selectedEvent.decisions || <em className="text-slate-400">Nenhuma decisão registrada até o momento.</em>}
                        </div>
                      </div>
                    </div>

                    {/* Premium AI Workspace Integration panel */}
                    <div className="bg-gradient-to-r from-indigo-50/60 to-violet-50/60 dark:from-slate-900 dark:to-indigo-950/20 p-4 rounded-xl border border-indigo-100/80 dark:border-indigo-900/45 space-y-3.5 mt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-indigo-500 animate-pulse" />
                          <div>
                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">WORKSPACE INTELIGENTE</span>
                            <span className="text-[11px] font-bold text-slate-850 dark:text-white">Automações com IA Gemini</span>
                          </div>
                        </div>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-600 text-white shrink-0 uppercase tracking-widest">
                          gemini-3.5-flash
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 leading-normal pl-0.5">
                        Analise instantaneamente os escopos e decisões tomadas para produzir Atas de reunião consolidadas que reduzem ruídos e criam cartões acionáveis no Kanban.
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1 border-t border-indigo-100/50 dark:border-indigo-950/40 pt-3">
                        <button
                          onClick={() => handleGenerateAISummary(selectedEvent)}
                          disabled={isGeneratingSummary}
                          className="flex items-center gap-1.5 text-[10px] bg-white dark:bg-slate-800 hover:bg-slate-200/50 border border-slate-200 dark:border-slate-700 font-bold text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg transition-all shadow-3xs cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {isGeneratingSummary ? (
                            <Activity className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                          )}
                          Gerar Ata Inteligente da Reunião
                        </button>

                        <button
                          onClick={() => handleGenerateAITasks(selectedEvent)}
                          disabled={isGeneratingTasks}
                          className="flex items-center gap-1.5 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {isGeneratingTasks ? (
                            <Activity className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckSquare className="h-3.5 w-3.5" />
                          )}
                          Extrair Plano de Ação & Criar Tarefas
                        </button>

                        <button
                          onClick={() => triggerPreEventMockAlert(selectedEvent)}
                          className="flex items-center gap-1.5 text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-2 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <Bell className="h-3.5 w-3.5" />
                          Simular Disparador de Alerta Prévio
                        </button>
                      </div>

                      {/* Display space of the AI Summary results */}
                      <AnimatePresence>
                        {aiSummary && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="bg-white dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-850 space-y-2 mt-2 shadow-2xs"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                              <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5 text-indigo-500" />
                                Ata Consolidada Gerada pela IA
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(aiSummary);
                                  showToast('Ata inteligente copiada para a área de transferência!', 'success');
                                }}
                                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5" /> Copiar ATA
                              </button>
                            </div>
                            <div className="text-xs text-slate-700 dark:text-slate-350 pr-1 max-h-56 overflow-y-auto leading-relaxed space-y-1">
                              <Markdown>{aiSummary}</Markdown>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>

                  </div>
                ) : (
                  
                  // Selected event modal EDIT FLOW Workspace
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest pl-1">
                      Você está editando o compromisso operacional
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Título do Compromisso *</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 p-2.5 rounded-lg outline-none focus:border-indigo-500 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Categoria</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as any)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 p-2.5 rounded-lg outline-none cursor-pointer dark:text-white"
                        >
                          {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500">Início *</label>
                        <input
                          type="datetime-local"
                          value={start}
                          required
                          onChange={(e) => setStart(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 p-2 rounded-lg outline-none dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500">Término</label>
                        <input
                          type="datetime-local"
                          value={end}
                          onChange={(e) => setEnd(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 p-2 rounded-lg outline-none dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <Layers className="h-3 w-3 text-indigo-500" /> Projeto
                        </label>
                        <select
                          value={selectedProject}
                          onChange={(e) => setSelectedProject(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 p-2.5 rounded-lg outline-none dark:text-white cursor-pointer"
                        >
                          <option value="">Nenhum Projeto</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <CheckSquare className="h-3 w-3 text-rose-500" /> Demanda Kanban
                        </label>
                        <select
                          value={selectedTask}
                          onChange={(e) => setSelectedTask(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-755 p-2.5 rounded-lg outline-none dark:text-white cursor-pointer"
                        >
                          <option value="">Nenhuma Demanda</option>
                          {tasks.map(t => (
                            <option key={t.id} value={t.id}>[{t.status}] {t.title.substring(0, 40)}...</option>
                          ))}
                        </select>
                      </div>

                    </div>

                    {/* Choose participants checklist directly */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-indigo-500" />
                        Participantes Convidados
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {users.map(u => {
                          const isSelected = selectedParticipants.includes(u.id);
                          return (
                            <button
                              type="button"
                              key={u.id}
                              onClick={() => handleToggleParticipant(u.id)}
                              className={`p-2 rounded-lg border text-[10.5px] font-bold text-left truncate transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-750 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-300' 
                                  : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800'
                              }`}
                            >
                              {u.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-semibold text-slate-500">Pauta e Escopo</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full text-xs h-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 p-2.5 rounded-lg outline-none focus:border-indigo-500 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500">Anotações de ATA</label>
                        <textarea
                          value={ataText}
                          onChange={(e) => setAtaText(e.target.value)}
                          className="w-full text-xs h-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 p-2.5 rounded-lg outline-none focus:border-indigo-500 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500">Decisões Tomadas</label>
                        <textarea
                          value={decisions}
                          onChange={(e) => setDecisions(e.target.value)}
                          className="w-full text-xs h-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 p-2.5 rounded-lg outline-none focus:border-indigo-500 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-indigo-50/40 dark:bg-indigo-950/20 p-2 rounded-lg border border-indigo-150/40">
                      <input
                        type="checkbox"
                        id="edit-auto-tasks-creation"
                        checked={generateTasksAutomatically}
                        onChange={(e) => setGenerateTasksAutomatically(e.target.checked)}
                        className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer"
                      />
                      <label htmlFor="edit-auto-tasks-creation" className="text-xs text-indigo-950 dark:text-indigo-300 font-bold cursor-pointer">
                        Mapear e Gerar Tarefas de Ação no Kanban automaticamente com base nas decisões
                      </label>
                    </div>

                  </div>
                )}

              </div>

              {/* Modal footer control Actions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-150 dark:border-slate-800 flex justify-between items-center shrink-0">
                
                {/* Delete/Trash control on Left */}
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="flex items-center gap-1.5 text-xs text-red-650 hover:text-red-750 font-extrabold px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Compromisso
                </button>

                <div className="flex items-center gap-2">
                  
                  {/* Standard options: closes modal or triggers Edit workspace */}
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => startEditingEvent(selectedEvent)}
                        className="flex items-center gap-1 text-xs font-extrabold px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-lg transition-all cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                        Editar Evento
                      </button>
                      
                      <button
                        onClick={() => setSelectedEvent(null)}
                        className="text-xs font-black px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg cursor-pointer"
                      >
                        Fechar Detalhes
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Edit Mode options: cancels editing workspace or saves */}
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-xs font-extrabold px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-lg transition-all cursor-pointer"
                      >
                        Descartar Alterações
                      </button>
                      
                      <button
                        onClick={handleUpdateEvent}
                        className="text-xs font-black px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer shadow-sm animate-pulse"
                      >
                        Salvar Alterações
                      </button>
                    </>
                  )}

                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
