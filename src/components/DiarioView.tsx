import React, { useState, useEffect } from 'react';
import { AppApi } from '../services/api';
import { User, Project, DiarioEntry, Category, Role, Meeting, Pendencia, Task, TaskPriority } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, Sparkles, Clock, AlertTriangle, CheckCircle, 
  BookOpen, Trash, Calendar, Tag, ChevronDown, ListPlus, Send, RefreshCw, X, ShieldAlert,
  Briefcase, Edit2, Users, FileText, Check, AlertCircle, HelpCircle, FileCheck
} from 'lucide-react';

interface DiarioViewProps {
  currentUser: User | null;
  projects: Project[];
  diaries: DiarioEntry[];
  users: User[];
  tasks: Task[];
  onRefreshDiaries: () => Promise<void>;
  onRefreshProjects: () => Promise<void>;
  onRefreshTasks: () => Promise<void>;
}

export default function DiarioView({ 
  currentUser, 
  projects, 
  diaries, 
  users, 
  tasks,
  onRefreshDiaries, 
  onRefreshProjects,
  onRefreshTasks
}: DiarioViewProps) {
  
  // Tab control within robust Logbook view: 'logs' | 'projects' | 'meetings' | 'pendencias'
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'projects' | 'meetings' | 'pendencias'>('logs');

  // Unified lists
  const [filteredDiaries, setFilteredDiaries] = useState<DiarioEntry[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  
  // Search and Filters for Diaries
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load backend localized states
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [loadingPendencias, setLoadingPendencias] = useState(false);

  // Diary form states
  const [isRegisteringDiary, setIsRegisteringDiary] = useState(false);
  const [diaryProjectId, setDiaryProjectId] = useState('');
  const [diaryCategory, setDiaryCategory] = useState<Category>('Desenvolvimento');
  const [diaryStatus, setDiaryStatus] = useState<'Estável' | 'Alerta' | 'Atencioso'>('Estável');
  const [diaryPerformedText, setDiaryPerformedText] = useState('');
  const [diaryProblemsText, setDiaryProblemsText] = useState('');
  const [diaryCompletedDemands, setDiaryCompletedDemands] = useState('');
  const [diaryObservations, setDiaryObservations] = useState('');
  const [diaryPendingText, setDiaryPendingText] = useState('');
  const [diaryNextSteps, setDiaryNextSteps] = useState('');
  const [diaryTimeSpentHours, setDiaryTimeSpentHours] = useState('4');
  const [diaryTagsInput, setDiaryTagsInput] = useState('');

  // AI Summary Modal states
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Projects CRUD state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  
  // Project form inputs
  const [projName, setProjName] = useState('');
  const [projDescription, setProjDescription] = useState('');
  const [projColor, setProjColor] = useState('#3b82f6');
  const [projObjective, setProjObjective] = useState('');
  const [projGoals, setProjGoals] = useState('');
  const [projDueDate, setProjDueDate] = useState('');
  const [projDeliverables, setProjDeliverables] = useState('');
  const [projSector, setProjSector] = useState('TI Core Sistemas');
  const [projTools, setProjTools] = useState('React, Vite, Express, PostgreSQL');
  const [projPriority, setProjPriority] = useState<'Baixa' | 'Média' | 'Alta' | 'Crítica'>('Média');
  const [projStatus, setProjStatus] = useState<'Planejamento' | 'Ativo' | 'Pausado' | 'Concluído'>('Ativo');
  const [projBudget, setProjBudget] = useState('R$ 0,00');
  const [projRisks, setProjRisks] = useState('');
  const [projDependencies, setProjDependencies] = useState('');
  const [projSuccessIndicators, setProjSuccessIndicators] = useState('');
  const [projAssignees, setProjAssignees] = useState<string[]>([]);
  const [projSupervisors, setProjSupervisors] = useState<string[]>([]);
  const [projObservers, setProjObservers] = useState<string[]>([]);

  // Meetings CRUD state
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [meetTime, setMeetTime] = useState('10:00');
  const [meetObjective, setMeetObjective] = useState('');
  const [meetAtaText, setMeetAtaText] = useState('');
  const [meetDecisions, setMeetDecisions] = useState('');
  const [meetPendingIssues, setMeetPendingIssues] = useState('');
  const [meetNextSteps, setMeetNextSteps] = useState('');
  const [meetParticipants, setMeetParticipants] = useState<string[]>([]);
  const [meetResponsibles, setMeetResponsibles] = useState<string[]>([]);
  const [meetGenerateTasks, setMeetGenerateTasks] = useState(true);
  const [meetProjectId, setMeetProjectId] = useState('');

  // Pendencias CRUD state
  const [isCreatingPendencia, setIsCreatingPendencia] = useState(false);
  const [selectedPendencia, setSelectedPendencia] = useState<Pendencia | null>(null);
  const [pendHistoryInput, setPendHistoryInput] = useState('');
  const [pendTitle, setPendTitle] = useState('');
  const [pendDescription, setPendDescription] = useState('');
  const [pendSector, setPendSector] = useState('TI Core Sistemas');
  const [pendUserResp, setPendUserResp] = useState('');
  const [pendTargetArea, setPendTargetArea] = useState('Matriz');
  const [pendDueDate, setPendDueDate] = useState('');
  const [pendProjectId, setPendProjectId] = useState('');

  // Rapid Demand/Autonomous task Creator
  const [isCreatingRapidDemand, setIsCreatingRapidDemand] = useState(false);
  const [rapidTitle, setRapidTitle] = useState('');
  const [rapidDesc, setRapidDesc] = useState('');
  const [rapidType, setRapidType] = useState<'demanda' | 'pendencia' | 'recorrente'>('demanda');
  const [rapidPriority, setRapidPriority] = useState<TaskPriority>('Média');
  const [rapidDueDate, setRapidDueDate] = useState('');
  const [rapidAssignee, setRapidAssignee] = useState('');
  const [rapidProjectId, setRapidProjectId] = useState('');

  // Auto fallback values
  useEffect(() => {
    if (projects.length > 0 && !diaryProjectId) {
      setDiaryProjectId(projects[0].id);
    }
    if (projects.length > 0 && !meetProjectId) {
      setMeetProjectId(projects[0].id);
    }
    if (projects.length > 0 && !pendProjectId) {
      setProjectIdForForms(projects[0].id);
    }
  }, [projects]);

  const setProjectIdForForms = (id: string) => {
    setPendProjectId(id);
    setRapidProjectId(id);
  };

  const loadOperationalData = async () => {
    setLoadingMeetings(true);
    setLoadingPendencias(true);
    try {
      const [m, p] = await Promise.all([
        AppApi.getMeetings(),
        AppApi.getPendencias()
      ]);
      setMeetings(m);
      setPendencias(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMeetings(false);
      setLoadingPendencias(false);
    }
  };

  useEffect(() => {
    loadOperationalData();
    applyDiariesFilters();
  }, [diaries, searchTerm, projectFilter, statusFilter, categoryFilter, activeSubTab]);

  const applyDiariesFilters = () => {
    let result = [...diaries];
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(d => 
        d.performedText.toLowerCase().includes(term) ||
        (d.problemsText && d.problemsText.toLowerCase().includes(term)) ||
        d.userName.toLowerCase().includes(term) ||
        d.projectName.toLowerCase().includes(term) ||
        d.tags.some(t => t.toLowerCase().includes(term))
      );
    }
    if (projectFilter !== 'all') {
      result = result.filter(d => d.projectId === projectFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter(d => d.category === categoryFilter);
    }
    setFilteredDiaries(result);
  };

  // --- DIARY ACTIONS ---
  const handleRegisterDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diaryPerformedText.trim()) return;

    try {
      const parsedTags = diaryTagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await AppApi.createDiary({
        projectId: diaryProjectId || projects[0]?.id,
        category: diaryCategory,
        performedText: diaryPerformedText,
        problemsText: diaryProblemsText,
        completedDemands: diaryCompletedDemands,
        observations: diaryObservations,
        status: diaryStatus,
        pendingText: diaryPendingText,
        nextSteps: diaryNextSteps,
        timeSpentSeconds: parseFloat(diaryTimeSpentHours) * 3600,
        tags: parsedTags,
        date: new Date().toISOString().split('T')[0]
      });

      setDiaryPerformedText('');
      setDiaryProblemsText('');
      setDiaryCompletedDemands('');
      setDiaryObservations('');
      setDiaryPendingText('');
      setDiaryNextSteps('');
      setDiaryTagsInput('');
      setIsRegisteringDiary(false);

      await onRefreshDiaries();
    } catch (err) {
      console.error(err);
      alert('Erro ao gravar Diário de Bordo.');
    }
  };

  // --- PROJECT CRUD HANDLERS ---
  const handleOpenCreateProject = () => {
    setEditingProject(null);
    setProjName('');
    setProjDescription('');
    setProjColor('#ef4444');
    setProjObjective('');
    setProjGoals('');
    setProjDueDate(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]);
    setProjDeliverables('');
    setProjSector('TI Core Sistemas');
    setProjTools('');
    setProjPriority('Média');
    setProjStatus('Ativo');
    setProjBudget('R$ 15.000,00');
    setProjRisks('');
    setProjDependencies('');
    setProjSuccessIndicators('');
    setProjAssignees([]);
    setProjSupervisors([]);
    setProjObservers([]);
    setIsCreatingProject(true);
  };

  const handleOpenEditProject = (p: Project) => {
    setEditingProject(p);
    setProjName(p.name);
    setProjDescription(p.description);
    setProjColor(p.color);
    setProjObjective(p.objective || '');
    setProjGoals(p.goals || '');
    setProjDueDate(p.dueDate || '');
    setProjDeliverables(p.deliverables || '');
    setProjSector(p.sector || '');
    setProjTools(p.tools || '');
    setProjPriority(p.priority || 'Média');
    setProjStatus(p.status || 'Ativo');
    setProjBudget(p.budget || '');
    setProjRisks(p.risks || '');
    setProjDependencies(p.dependencies || '');
    setProjSuccessIndicators(p.successIndicators || '');
    setProjAssignees(p.assignees || []);
    setProjSupervisors(p.supervisors || []);
    setProjObservers(p.observers || []);
    setIsCreatingProject(true);
  };

  const saveProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;

    const payload: Partial<Project> = {
      name: projName,
      description: projDescription,
      color: projColor,
      objective: projObjective,
      goals: projGoals,
      dueDate: projDueDate,
      deliverables: projDeliverables,
      sector: projSector,
      tools: projTools,
      priority: projPriority,
      status: projStatus,
      budget: projBudget,
      risks: projRisks,
      dependencies: projDependencies,
      successIndicators: projSuccessIndicators,
      assignees: projAssignees,
      supervisors: projSupervisors,
      observers: projObservers
    };

    try {
      if (editingProject) {
        await AppApi.updateProject(editingProject.id, payload);
        alert('Projeto atualizado com sucesso!');
      } else {
        await AppApi.createProject(payload);
        alert('Novo projeto cadastrado com sucesso!');
      }
      setIsCreatingProject(false);
      setEditingProject(null);
      await onRefreshProjects();
    } catch (err) {
      console.error(err);
      alert('Erro ao gravar projeto.');
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza de que deseja excluir permanentemente o projeto "${name}"? Todos os diários associados permanecerão.`)) {
      return;
    }
    try {
      await AppApi.deleteProject(id);
      await onRefreshProjects();
      alert('Projeto excluído com sucesso.');
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir projeto.');
    }
  };

  // --- MEETING REGISTERING ---
  const handleRegisterMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim()) return;

    try {
      await AppApi.createMeeting({
        title: meetTitle,
        date: meetDate || new Date().toISOString().split('T')[0],
        time: meetTime,
        objective: meetObjective,
        participants: meetParticipants,
        ataText: meetAtaText,
        decisions: meetDecisions,
        pendingIssues: meetPendingIssues,
        responsibles: meetResponsibles,
        nextSteps: meetNextSteps,
        generateTasksAutomatically: meetGenerateTasks,
        projectId: meetProjectId || projects[0]?.id
      });

      // Clear fields
      setMeetTitle('');
      setMeetObjective('');
      setMeetAtaText('');
      setMeetDecisions('');
      setMeetPendingIssues('');
      setMeetNextSteps('');
      setMeetParticipants([]);
      setMeetResponsibles([]);
      setIsCreatingMeeting(false);

      alert('Ata de Reunião inserida! Se selecionou auto-geração, a tarefa correspondente já aguarda no Kanban com e-mail e alerta do Chat.');
      await loadOperationalData();
      await onRefreshTasks();
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar ata.');
    }
  };

  // --- FILA DE PENDENCIAS ---
  const handleRegisterPendencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendTitle.trim()) return;

    try {
      await AppApi.createPendencia({
        title: pendTitle,
        description: pendDescription,
        sectorResponsible: pendSector,
        userResponsibleId: pendUserResp || users[0]?.id,
        targetArea: pendTargetArea,
        dueDate: pendDueDate || new Date().toISOString().split('T')[0],
        projectId: pendProjectId || projects[0]?.id
      });

      // Clear
      setPendTitle('');
      setPendDescription('');
      setPendSector('TI Core Sistemas');
      setPendUserResp('');
      setPendTargetArea('Matriz');
      setPendDueDate('');
      setIsCreatingPendencia(false);

      alert('Pendência cadastrada no tracker operacional!');
      await loadOperationalData();
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar pendência.');
    }
  };

  const handleUpdatePendenciaStatus = async (id: string, newStatus: any) => {
    try {
      await AppApi.updatePendencia(id, { status: newStatus });
      alert('Status da pendência atualizado!');
      await loadOperationalData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPendHistory = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!pendHistoryInput.trim()) return;

    try {
      await AppApi.addPendenciaHistory(id, pendHistoryInput);
      setPendHistoryInput('');
      const updated = await AppApi.getPendencias();
      setPendencias(updated);
      const sel = updated.find(p => p.id === id);
      if (sel) setSelectedPendencia(sel);
      alert('Acompanhamento técnico incluído no histórico!');
    } catch (err) {
      console.error(err);
    }
  };

  // --- RAPID DEMANDS ---
  const handleCreateRapidDemandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rapidTitle.trim()) return;

    try {
      await AppApi.createTask({
        title: `${rapidType.toUpperCase()}: ${rapidTitle}`,
        description: `Demanda corporativa autônoma de tipo ${rapidType}. ${rapidDesc}`,
        priority: rapidPriority,
        projectId: rapidProjectId || projects[0]?.id,
        assignees: rapidAssignee ? [rapidAssignee] : [],
        dueDate: rapidDueDate || new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
        tags: [rapidType, 'Rápida'],
        subtasks: [
          { id: `s-rap-${Date.now()}`, title: 'Verificar alinhamento operacional', completed: false }
        ],
        demandType: rapidType as any
      });

      setRapidTitle('');
      setRapidDesc('');
      setRapidType('demanda');
      setRapidPriority('Média');
      setRapidDueDate('');
      setRapidAssignee('');
      setIsCreatingRapidDemand(false);

      alert('Demanda registrada e adicionada instantaneamente ao Kanban do time!');
      await onRefreshTasks();
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar demanda rápida.');
    }
  };

  // --- AI GENERATION ---
  const handleGenerateAiSummary = async () => {
    try {
      setGeneratingSummary(true);
      setShowAiModal(true);
      setAiSummary(null);
      const res = await AppApi.generateAiOperationalSummary();
      setAiSummary(res.summary);
    } catch (err) {
      console.error(err);
      setAiSummary('### Erve operacional ao se conectar ao Gemini.\nTente novamente em alguns segundos.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  // Utility helpers
  const formatTimeSeconds = (sec: number) => {
    return `${(sec / 3600).toFixed(1)}h`;
  };

  const categoriesList: Category[] = [
    'Desenvolvimento', 'Suporte(Chamado)', 'Reunião', 'Monitoramento', 'Infraestrutura', 'Documentação', 'Melhoria'
  ];

  const renderSimpleMarkdown = (markdown: string) => {
    return markdown
      .split('\n')
      .map((line, idx) => {
        let trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2);
          const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return <li key={idx} className="ml-4 list-disc text-xs text-slate-700 dark:text-slate-300 pr-1 mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedContent }} />;
        }
        if (trimmed.startsWith('### ')) {
          return <h4 key={idx} className="text-sm font-bold text-slate-900 dark:text-white mt-4 mb-2 first:mt-1">{trimmed.substring(4)}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={idx} className="text-base font-bold text-indigo-700 dark:text-indigo-400 mt-5 mb-2 first:mt-1">{trimmed.substring(3)}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          return <h2 key={idx} className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-3 border-b pb-1 first:mt-1">{trimmed.substring(2)}</h2>;
        }
        if (trimmed === '') return <div key={idx} className="h-2" />;
        const formattedLine = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-700 dark:text-indigo-300">$1</strong>');
        return <p key={idx} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
      });
  };

  const isOverdue = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const toggleSelectUser = (id: string, list: string[], setter: Function) => {
    if (list.includes(id)) {
      setter(list.filter(x => x !== id));
    } else {
      setter([...list, id]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="diario-view-root">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Diário de Bordo Staff Britânia
            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full uppercase font-bold tracking-wider">
              Central COE
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Planejamento operacional completo, controle síncrono de projetos, atas de reuniões e fila de monitoração de pendências.
          </p>
        </div>
        
        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateAiSummary}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Boletim de Operações IA
          </button>
        </div>
      </div>

      {/* Level 2 Sub-Tabs selectors */}
      <div className="flex flex-wrap gap-1 border-b border-slate-205 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-3 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'logs'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Logs Diários de Bordo ({diaries.length})
        </button>
        <button
          onClick={() => setActiveSubTab('projects')}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-3 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'projects'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-705'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Projetos & Portfólio ({projects.length})
        </button>
        <button
          onClick={() => setActiveSubTab('meetings')}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-3 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'meetings'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-705'
          }`}
        >
          <Users className="h-4 w-4" />
          Atas de Reuniões ({meetings.length})
        </button>
        <button
          onClick={() => setActiveSubTab('pendencias')}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-3 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'pendencias'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-705'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Fila de Pendências & SLA ({pendencias.length})
        </button>
      </div>

      {/* --- TAB CONTENT 1: DIARIES LOGS --- */}
      {activeSubTab === 'logs' && (
        <div className="space-y-6">
          
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-slate-500">
              Registros cotidianos do time de staff para apurar o faturamento e cronometragens.
            </div>
            <button
              onClick={() => setIsRegisteringDiary(!isRegisteringDiary)}
              className="flex items-center gap-2 text-xs font-bold px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              Lançar Diário de Bordo
            </button>
          </div>

          <AnimatePresence>
            {isRegisteringDiary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-205 dark:border-slate-800 p-5 shadow-sm space-y-4"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="h-4.5 w-4.5 text-indigo-500" />
                  Cadastrar Atividade de Hoje
                </h3>
                
                <form onSubmit={handleRegisterDiary} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Projeto Vinculado</label>
                    <select
                      value={diaryProjectId}
                      onChange={(e) => setDiaryProjectId(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none focus:border-indigo-505"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Categoria</label>
                    <select
                      value={diaryCategory}
                      onChange={(e) => setDiaryCategory(e.target.value as Category)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none focus:border-indigo-505"
                    >
                      {categoriesList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Tempo Consumido (Horas)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      value={diaryTimeSpentHours}
                      onChange={(e) => setDiaryTimeSpentHours(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 dark:text-white outline-none"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Atividades Executadas *</label>
                    <textarea
                      value={diaryPerformedText}
                      onChange={(e) => setDiaryPerformedText(e.target.value)}
                      required
                      placeholder="Descreva detalhadamente o que desenvolveu ou resolveu..."
                      className="w-full text-xs h-18 bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-1.5 space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Chamados Concluídos</label>
                    <input
                      type="text"
                      value={diaryCompletedDemands}
                      onChange={(e) => setDiaryCompletedDemands(e.target.value)}
                      placeholder="Ex: #4592, #4720"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 dark:text-white outline-none"
                    />
                  </div>
                  <div className="md:col-span-1.5 space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Instabilidade / Impedimento</label>
                    <input
                      type="text"
                      value={diaryProblemsText}
                      onChange={(e) => setDiaryProblemsText(e.target.value)}
                      placeholder="Lentidão na rede, liberação regulatória pendente..."
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 dark:text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Pendências Rápidas</label>
                    <input
                      type="text"
                      value={diaryPendingText}
                      onChange={(e) => setDiaryPendingText(e.target.value)}
                      placeholder="Subtarefas não finalizadas..."
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Próximos Passos</label>
                    <input
                      type="text"
                      value={diaryNextSteps}
                      onChange={(e) => setDiaryNextSteps(e.target.value)}
                      placeholder="O que fará no próximo expediente..."
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Tags (SQL, Protheus...)</label>
                    <input
                      type="text"
                      value={diaryTagsInput}
                      onChange={(e) => setDiaryTagsInput(e.target.value)}
                      placeholder="faturamento, sap, sac"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 dark:text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Status Operacional do Dia</label>
                    <div className="flex gap-2">
                      {(['Estável', 'Alerta', 'Atencioso'] as const).map(st => {
                        const sel = diaryStatus === st;
                        const colors = {
                          'Estável': 'bg-emerald-500 text-white',
                          'Alerta': 'bg-amber-500 text-white',
                          'Atencioso': 'bg-indigo-500 text-white'
                        };
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setDiaryStatus(st)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all active:scale-95 ${
                              sel ? colors[st] : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent'
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Observações Gerais</label>
                    <input
                      type="text"
                      value={diaryObservations}
                      onChange={(e) => setDiaryObservations(e.target.value)}
                      placeholder="Notas adicionais..."
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 dark:text-white outline-none"
                    />
                  </div>

                  <div className="md:col-span-3 pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRegisteringDiary(false)}
                      className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Lançar Atividade
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters Area */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar logs (palavra-chave, autor, tag, projeto)..."
                className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg outline-none focus:ring-1 focus:ring-indigo-550"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 font-bold">
                <Filter className="h-3.5 w-3.5" />
                <span>Filtros:</span>
              </div>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-300 rounded-lg p-2.5 outline-none cursor-pointer"
              >
                <option value="all">Todos Projetos</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-300 rounded-lg p-2.5 outline-none cursor-pointer"
              >
                <option value="all">Qualquer Status</option>
                <option value="Estável">Estável</option>
                <option value="Alerta">Alerta</option>
                <option value="Atencioso">Atencioso</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-850 border border-slate-205 dark:border-slate-700 text-slate-755 dark:text-slate-300 rounded-lg p-2.5 outline-none cursor-pointer"
              >
                <option value="all">Categorias</option>
                {categoriesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Mapping */}
          <div className="space-y-4">
            {filteredDiaries.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1">
                <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-slate-500 text-sm">Nenhum registro de Diário localizado.</p>
              </div>
            ) : (
              filteredDiaries.map((diary) => {
                const dateStr = new Date(diary.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                const colors = {
                  'Estável': 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-100',
                  'Alerta': 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-100',
                  'Atencioso': 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 border-blue-100'
                };
                return (
                  <motion.div
                    key={diary.id}
                    layoutId={`diary-${diary.id}`}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5"
                  >
                    <div className="md:w-56 flex flex-col space-y-2 shrink-0 md:border-r border-slate-100 dark:border-slate-800 md:pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 rounded bg-indigo-505" />
                        <div>
                          <div className="text-xs font-bold text-slate-850 dark:text-slate-200">{diary.userName}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">{diary.userRole}</div>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-450 space-y-0.5">
                        <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-400" /> {dateStr}</div>
                        <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" /> {formatTimeSeconds(diary.timeSpentSeconds)}</div>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded border">
                          {diary.projectName}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 rounded">
                          {diary.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Procedimento Efetuado</span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{diary.performedText}</p>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shrink-0 ${colors[diary.status]}`}>
                          {diary.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                        {diary.problemsText && (
                          <div className="text-xs leading-none">
                            <span className="text-[9px] text-rose-500 font-bold block uppercase mb-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Impedimento</span>
                            <span className="text-slate-500 dark:text-slate-405 leading-relaxed">{diary.problemsText}</span>
                          </div>
                        )}
                        {diary.completedDemands && (
                          <div className="text-xs leading-none">
                            <span className="text-[9px] text-emerald-500 font-bold block uppercase mb-1 flex items-center gap-1"><Check className="h-3 w-3" /> Entregas</span>
                            <span className="text-slate-500 dark:text-slate-405 leading-relaxed">{diary.completedDemands}</span>
                          </div>
                        )}
                        {diary.pendingText && (
                          <div className="text-xs col-span-1 md:col-span-2">
                            <span className="text-[9px] text-amber-500 font-bold block uppercase mb-1">Pendência Ativa</span>
                            <span className="text-slate-500 dark:text-slate-405 leading-relaxed">{diary.pendingText}</span>
                          </div>
                        )}
                        {diary.nextSteps && (
                          <div className="text-xs">
                            <span className="text-[9px] text-indigo-500 font-bold block uppercase mb-1">Passos Seguintes</span>
                            <span className="text-slate-500 dark:text-slate-405 leading-relaxed">{diary.nextSteps}</span>
                          </div>
                        )}
                        {diary.observations && (
                          <div className="text-xs">
                            <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Notas Gerais</span>
                            <span className="text-slate-500 dark:text-slate-405 leading-relaxed">{diary.observations}</span>
                          </div>
                        )}
                      </div>

                      {diary.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {diary.tags.map(t => (
                            <span key={t} className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded border border-transparent hover:border-indigo-300">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* --- TAB CONTENT 2: PORTFOLIO & PROJECTS (FULL DETAILS WRITEOUT) --- */}
      {activeSubTab === 'projects' && (
        <div className="space-y-6">
          
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-1.5">
                <Briefcase className="h-4.5 w-4.5 text-indigo-500" />
                Portfólio de Projetos Corporativos Staff
              </h3>
              <p className="text-xs text-slate-500 mt-1">Crie projetos complexos ou registre de forma autônoma demandas isoladas da semana.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreatingRapidDemand(true)}
                className="text-xs font-bold px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-1"
                title="Nem toda atividade necessita de um projeto completo. Use isto para registrar demandas rápidas, recorrentes ou pontuais no Kanban."
              >
                <ListPlus className="h-4 w-4" />
                Registrar Demanda/Recorrente Rápida
              </button>
              <button
                onClick={handleOpenCreateProject}
                className="text-xs font-bold px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Novo Projeto Estruturado
              </button>
            </div>
          </div>

          {/* Form Create/Edit Project */}
          <AnimatePresence>
            {isCreatingProject && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-205 dark:border-slate-800 p-5 shadow-lg space-y-4"
              >
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-550" />
                  {editingProject ? `Editar Projeto: ${editingProject.name}` : 'Novo Projeto de Alta Performance COE'}
                </h3>

                <form onSubmit={saveProjectSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500">Nome do Projeto *</label>
                    <input
                      type="text"
                      required
                      value={projName}
                      onChange={(e) => setProjName(e.target.value)}
                      placeholder="Ex: Migração Banco de Dados SAC Joinville"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Área / Setor</label>
                    <input
                      type="text"
                      value={projSector}
                      onChange={(e) => setProjSector(e.target.value)}
                      placeholder="TI Core Sistemas"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Identificação Visual (Cor)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={projColor}
                        onChange={(e) => setProjColor(e.target.value)}
                        className="w-8 h-8 rounded border p-0 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={projColor}
                        onChange={(e) => setProjColor(e.target.value)}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-1.5 dark:text-white outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500">Descrição Executiva</label>
                    <textarea
                      value={projDescription}
                      onChange={(e) => setProjDescription(e.target.value)}
                      placeholder="Visão panorâmica dos componentes envolvidos..."
                      className="w-full text-xs h-16 bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500">Objetivo Principal do Projeto</label>
                    <textarea
                      value={projObjective}
                      onChange={(e) => setProjObjective(e.target.value)}
                      placeholder="Por que estamos desenvolvendo isto? (Ex: Isolar conexões externas e cortar latência SQL)"
                      className="w-full text-xs h-16 bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Metas Claras</label>
                    <input
                      type="text"
                      value={projGoals}
                      onChange={(e) => setProjGoals(e.target.value)}
                      placeholder="Meta: SLA > 99.8%"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Prazo Estimado (SLA)</label>
                    <input
                      type="date"
                      value={projDueDate}
                      onChange={(e) => setProjDueDate(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Orçamento Previsto</label>
                    <input
                      type="text"
                      value={projBudget}
                      onChange={(e) => setProjBudget(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Entregáveis Tangíveis</label>
                    <input
                      type="text"
                      value={projDeliverables}
                      onChange={(e) => setProjDeliverables(e.target.value)}
                      placeholder="Painel de Configuração, Script migrador"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg dark:text-white outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500">Ferramentas Utilizadas</label>
                    <input
                      type="text"
                      value={projTools}
                      onChange={(e) => setProjTools(e.target.value)}
                      placeholder="SAP, Protheus REST API, Node.js"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Controle de Criticidade</label>
                    <select
                      value={projPriority}
                      onChange={(e) => setProjPriority(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg dark:text-white outline-none cursor-pointer"
                    >
                      <option value="Baixa">Prioridade Baixa</option>
                      <option value="Média">Prioridade Média</option>
                      <option value="Alta">Prioridade Alta</option>
                      <option value="Crítica">Prioridade Crítica</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Status Geral do Fluxo</label>
                    <select
                      value={projStatus}
                      onChange={(e) => setProjStatus(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg dark:text-white outline-none cursor-pointer"
                    >
                      <option value="Planejamento">Planejamento</option>
                      <option value="Ativo">Ativo</option>
                      <option value="Pausado">Pausado</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500">Riscos Mapeados pela Liderança</label>
                    <input
                      type="text"
                      value={projRisks}
                      onChange={(e) => setProjRisks(e.target.value)}
                      placeholder="Conflito de IP, timeout no ERP de Joinville..."
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Dependências Técnicas</label>
                    <input
                      type="text"
                      value={projDependencies}
                      onChange={(e) => setProjDependencies(e.target.value)}
                      placeholder="Liberação de portas de firewall na matriz"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Indicadores de Sucesso (KPIs)</label>
                    <input
                      type="text"
                      value={projSuccessIndicators}
                      onChange={(e) => setProjSuccessIndicators(e.target.value)}
                      placeholder="Tempo médio de resposta < 200ms"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg dark:text-white outline-none"
                    />
                  </div>

                  {/* Multi-roles simple mapping section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:col-span-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Responsáveis Designados</span>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1 bg-white dark:bg-slate-900 border rounded p-1.5">
                        {users.map(u => (
                          <label key={u.id} className="flex items-center gap-1.5 text-xs text-slate-750 dark:text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={projAssignees.includes(u.id)}
                              onChange={() => toggleSelectUser(u.id, projAssignees, setProjAssignees)}
                            />
                            {u.name}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Supervisores do Projeto</span>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1 bg-white dark:bg-slate-900 border rounded p-1.5">
                        {users.filter(u => u.role !== 'Analista').map(u => (
                          <label key={u.id} className="flex items-center gap-1.5 text-xs text-slate-750 dark:text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={projSupervisors.includes(u.id)}
                              onChange={() => toggleSelectUser(u.id, projSupervisors, setProjSupervisors)}
                            />
                            {u.name}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Observadores Autorizados</span>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1 bg-white dark:bg-slate-900 border rounded p-1.5">
                        {users.map(u => (
                          <label key={u.id} className="flex items-center gap-1.5 text-xs text-slate-755 dark:text-slate-205 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={projObservers.includes(u.id)}
                              onChange={() => toggleSelectUser(u.id, projObservers, setProjObservers)}
                            />
                            {u.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => { setIsCreatingProject(false); setEditingProject(null); }}
                      className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-650 rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Salvar Cadastro
                    </button>
                  </div>

                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Create Rapid demand */}
          <AnimatePresence>
            {isCreatingRapidDemand && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-205 dark:border-slate-800 p-5 shadow-lg space-y-4"
              >
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ListPlus className="h-4.5 w-4.5 text-amber-500" />
                  Registrar Demanda ou Atividade Recorrente Operacional Rápida
                </h3>

                <form onSubmit={handleCreateRapidDemandSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Título / Assunto</label>
                    <input
                      type="text"
                      required
                      value={rapidTitle}
                      onChange={(e) => setRapidTitle(e.target.value)}
                      placeholder="Ex: Liberar IP da Jadlog no Gateway ou Backup semanal"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Tipo de Classificação</label>
                    <select
                      value={rapidType}
                      onChange={(e) => setRapidType(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="demanda">Demanda Operacional Avulsa</option>
                      <option value="recorrente">Atividade Recorrente Periódica</option>
                      <option value="pendencia">Atividade Comercial / Pendência</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Prioridade</label>
                    <select
                      value={rapidPriority}
                      onChange={(e) => setRapidPriority(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Crítica">Urgente/Crítica</option>
                    </select>
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-xs font-bold text-slate-500">Detalhamento Técnico</label>
                    <textarea
                      value={rapidDesc}
                      onChange={(e) => setRapidDesc(e.target.value)}
                      placeholder="Descreva as ações que determinam a conclusão desse chamado síncrono da equipe..."
                      className="w-full text-xs h-16 bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 dark:text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Projeto Vinculado (Opcional)</label>
                    <select
                      value={rapidProjectId}
                      onChange={(e) => setRapidProjectId(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-805 border rounded-lg p-2.5 dark:text-white cursor-pointer"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Prazo de Resolução</label>
                    <input
                      type="date"
                      value={rapidDueDate}
                      onChange={(e) => setRapidDueDate(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Ponto Focal (Responsável)</label>
                    <select
                      value={rapidAssignee}
                      onChange={(e) => setRapidAssignee(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-808 border rounded-lg p-2.5 dark:text-white cursor-pointer"
                    >
                      <option value="">Nenhum (Lançar na Caixa Geral)</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t text-xs">
                    <button
                      type="button"
                      onClick={() => setIsCreatingRapidDemand(false)}
                      className="px-4 py-2 font-bold bg-slate-100 dark:bg-slate-800 text-slate-650 rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg cursor-pointer"
                    >
                      Inserir no Kanban
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Portfolio Bento Grid Layout mapping */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => {
              const relatedTasks = tasks.filter(t => t.projectId === p.id);
              const compCount = relatedTasks.filter(t => t.status==='Concluído').length;
              const openCount = relatedTasks.length - compCount;
              
              const priorityColors = {
                'Baixa': 'bg-slate-100 text-slate-600',
                'Média': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                'Alta': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                'Crítica': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
              };

              return (
                <div 
                  key={p.id}
                  className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative flex flex-col justify-between hover:scale-[1.01] transition-transform duration-250"
                >
                  <div className="space-y-3.5">
                    {/* Upper color tag and buttons */}
                    <div className="flex items-center justify-between">
                      <span className="w-4 h-4 rounded-full border border-white dark:border-slate-905" style={{ backgroundColor: p.color }} />
                      
                      <div className="flex items-center gap-1.5 z-10">
                        <button
                          onClick={() => handleOpenEditProject(p)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-505 rounded-md transition-colors"
                          title="Editar Parâmetros"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id, p.name)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                          title="Excluir Projeto"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">{p.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {p.objective && (
                        <div className="text-[11px] leading-snug text-slate-400 dark:text-slate-500">
                          <strong className="text-slate-705 dark:text-slate-300">Objetivo:</strong> {p.objective}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-slate-400">
                        <div>
                          <span>Setor:</span>
                          <span className="block text-slate-705 dark:text-slate-350">{p.sector || 'TI Staff'}</span>
                        </div>
                        <div>
                          <span>SLA / Vence em:</span>
                          <span className="block text-slate-705 dark:text-slate-350">{p.dueDate || 'Recorrente'}</span>
                        </div>
                        <div>
                          <span>Criticidade:</span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] ${priorityColors[p.priority || 'Média']}`}>
                            {p.priority || 'Média'}
                          </span>
                        </div>
                        <div>
                          <span>Status:</span>
                          <span className="block text-indigo-500 font-black">{p.status || 'Ativo'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed field writeouts for Bento Grid depth compliance */}
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                      <div><strong className="text-slate-700 dark:text-slate-300">Ferramentas:</strong> {p.tools || 'Padrão'}</div>
                      <div><strong className="text-slate-700 dark:text-slate-300">Orçamento:</strong> {p.budget || 'N/D'}</div>
                      {p.risks && <div><strong className="text-rose-505 font-bold">Riscos:</strong> {p.risks}</div>}
                      {p.dependencies && <div><strong className="text-amber-505 font-bold">Obstáculo:</strong> {p.dependencies}</div>}
                    </div>

                    {/* Assignees visualization */}
                    <div className="pt-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Membros Envolvidos ({p.assignees?.length || 0})</span>
                      <div className="flex flex-wrap gap-1 leading-none">
                        {p.assignees?.map(userId => {
                          const found = users.find(u => u.id === userId);
                          if (!found) return null;
                          return (
                            <span key={userId} className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded" title={found.name}>
                              {found.name.split(' ')[0]}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  <div className="pt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-4 leading-none">
                    <span>{openCount} ativas / {compCount} concluintes</span>
                    <span className="font-mono bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {relatedTasks.length} cards
                    </span>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* --- TAB CONTENT 3: MEETINGS ATA RECOVERY & GENERATION --- */}
      {activeSubTab === 'meetings' && (
        <div className="space-y-6">
          
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-1.5">
                <Users className="h-4.5 w-4.5 text-indigo-500" />
                Histórico de Alinhamento e Atas de Reuniões
              </h3>
              <p className="text-xs text-slate-500 mt-1">Registre as decisões tomadas em conferência diária ou semanal. O sistema gera automaticamente os cards no Kanban de forma inteligente.</p>
            </div>
            
            <button
              onClick={() => setIsCreatingMeeting(!isCreatingMeeting)}
              className="text-xs font-bold px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Lançar Ata de Reunião
            </button>
          </div>

          <AnimatePresence>
            {isCreatingMeeting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-205 dark:border-slate-800 p-5 shadow-sm space-y-4"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="h-4.5 w-4.5 text-indigo-500" />
                  Cadastrar Painel de ATA Geral
                </h3>

                <form onSubmit={handleRegisterMeeting} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500">Tema / Título da Reunião *</label>
                    <input
                      type="text"
                      required
                      value={meetTitle}
                      onChange={(e) => setMeetTitle(e.target.value)}
                      placeholder="Ex: Alinhamento de Faturamento Logística Semanal"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Projeto Alinhado</label>
                    <select
                      value={meetProjectId}
                      onChange={(e) => setMeetProjectId(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-805 border rounded-lg p-2.5 dark:text-white outline-none cursor-pointer"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Objetivo</label>
                    <input
                      type="text"
                      value={meetObjective}
                      onChange={(e) => setMeetObjective(e.target.value)}
                      placeholder="Ex: Alinhar incidentes pendentes em Joinville"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-850 border rounded-lg p-2.5 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Data do Alinhamento</label>
                    <input
                      type="date"
                      value={meetDate}
                      onChange={(e) => setMeetDate(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Horário</label>
                    <input
                      type="text"
                      value={meetTime}
                      onChange={(e) => setMeetTime(e.target.value)}
                      placeholder="10:00"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-xs font-bold text-slate-500">Discussão e Ata Geral</label>
                    <textarea
                      value={meetAtaText}
                      onChange={(e) => setMeetAtaText(e.target.value)}
                      placeholder="Resumo geral das pautas e relatórios abordados..."
                      className="w-full text-xs h-18 bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 dark:text-white outline-none"
                    />
                  </div>

                  <div className="md:col-span-1.5 space-y-1">
                    <label className="text-xs font-bold text-slate-500">Decisões Definidas</label>
                    <textarea
                      value={meetDecisions}
                      onChange={(e) => setMeetDecisions(e.target.value)}
                      placeholder="Aprovado novo protocolo de contingência em Joinville..."
                      className="w-full text-xs h-16 bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 dark:text-white outline-none"
                    />
                  </div>
                  <div className="md:col-span-1.5 space-y-1">
                    <label className="text-xs font-bold text-slate-500">Pendências Detectadas</label>
                    <textarea
                      value={meetPendingIssues}
                      onChange={(e) => setMeetPendingIssues(e.target.value)}
                      placeholder="Jadlog precisa liberar acessos ao IP de Joinp..."
                      className="w-full text-xs h-16 bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 dark:text-white outline-none"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-xs font-bold text-slate-500">Próximos Passos</label>
                    <input
                      type="text"
                      value={meetNextSteps}
                      onChange={(e) => setMeetNextSteps(e.target.value)}
                      placeholder="Ex: Executar migração do SQL na sexta-feira às 22h"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none"
                    />
                  </div>

                  {/* Multi Select for participants and responsibles */}
                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Participantes Presentes</span>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1 bg-white dark:bg-slate-900 border rounded p-1.5 focus:border-indigo-505">
                        {users.map(u => (
                          <label key={u.id} className="flex items-center gap-1.5 text-slate-755 dark:text-slate-205 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={meetParticipants.includes(u.id)}
                              onChange={() => toggleSelectUser(u.id, meetParticipants, setMeetParticipants)}
                            />
                            {u.name}
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Responsáveis Designados (Ações Pós-Ata)</span>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1 bg-white dark:bg-slate-900 border rounded p-1.5">
                        {users.map(u => (
                          <label key={u.id} className="flex items-center gap-1.5 text-slate-755 dark:text-slate-205 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={meetResponsibles.includes(u.id)}
                              onChange={() => toggleSelectUser(u.id, meetResponsibles, setMeetResponsibles)}
                            />
                            {u.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tick option task generation */}
                  <div className="md:col-span-3 p-3 bg-slate-50 dark:bg-slate-805/50 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-850 dark:text-white block">Auto-Gerar Cards e Avisos?</span>
                      <span className="text-[10px] text-slate-400 block">Identifica parceiros, gera tarefas pós-reunião no Kanban operacional e dispara alerta de chat.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={meetGenerateTasks}
                        onChange={(e) => setMeetGenerateTasks(e.target.checked)}
                        className="sr-only peer hidden"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors relative ${meetGenerateTasks ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-[2px] transition-transform ${meetGenerateTasks ? 'left-[22px]' : 'left-[2px]'}`} />
                      </div>
                    </label>
                  </div>

                  <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t text-xs">
                    <button
                      type="button"
                      onClick={() => setIsCreatingMeeting(false)}
                      className="px-4 py-2 font-bold bg-slate-100 dark:bg-slate-800 text-slate-655 rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Lançar ata geral
                    </button>
                  </div>

                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List meetings card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {meetings.map(m => {
              const dateStr = new Date(m.date).toLocaleDateString('pt-BR');
              const linkedProj = projects.find(p => p.id === m.projectId);
              return (
                <div 
                  key={m.id}
                  className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl p-5 shadow-xs relative flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-808 px-2 py-1 rounded-lg">
                        {dateStr} • {m.time}
                      </span>
                      {linkedProj && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded leading-none text-white uppercase" style={{ backgroundColor: linkedProj.color }}>
                          {linkedProj.name}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-slate-850 dark:text-white leading-snug">{m.title}</h4>
                    
                    {m.objective && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium"><strong>Objetivo:</strong> {m.objective}</p>
                    )}

                    <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Discussão e ATA</span>
                        <p className="text-xs text-slate-705 dark:text-slate-300 leading-relaxed font-sans line-clamp-3 hover:line-clamp-none transition-all">{m.ataText || 'Sem anotações textuais registradas.'}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-[11px] leading-snug">
                        {m.decisions && (
                          <div className="bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100/50 p-2 rounded-xl">
                            <span className="text-[9px] font-black uppercase tracking-widest block text-emerald-600 mb-0.5">Metas e Decisões</span>
                            <span className="text-slate-500 dark:text-slate-400 font-sans">{m.decisions}</span>
                          </div>
                        )}
                        {m.pendingIssues && (
                          <div className="bg-amber-50/40 dark:bg-amber-950/15 border border-amber-100/50 p-2 rounded-xl">
                            <span className="text-[9px] font-black uppercase tracking-widest block text-amber-600 mb-0.5">Pendências</span>
                            <span className="text-slate-500 dark:text-slate-400 font-sans">{m.pendingIssues}</span>
                          </div>
                        )}
                      </div>

                      {m.nextSteps && (
                        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-805 text-xs text-slate-500">
                          <strong className="text-indigo-500 dark:text-indigo-400 uppercase text-[9px] font-bold tracking-wider block mb-0.5">Ações para a Semana</strong>
                          {m.nextSteps}
                        </div>
                      )}

                      <div className="pt-2 text-[10px] text-slate-400">
                        <strong className="block uppercase tracking-wider mb-1">Equipe Confraternizada ({m.participants?.length || 0})</strong>
                        <div className="flex flex-wrap gap-1 leading-none">
                          {m.participants?.map(id => (
                            <span key={id} className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border rounded">
                              {users.find(u => u.id === id)?.name || 'Anônimo'}
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 text-[10px] text-slate-400 flex items-center justify-between leading-none">
                    <span>Auto-Task: {m.generateTasksAutomatically ? '✅ Vinculada no Kanban' : '❌ Desconsiderada'}</span>
                    <span>Criado por Supervisor</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* --- TAB CONTENT 4: ISSUE TRACKER / FILA DE PENDENCIAS --- */}
      {activeSubTab === 'pendencias' && (
        <div className="space-y-6">
          
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-1.5">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
                Fila de Pendências Críticas e Controle de SLA
              </h3>
              <p className="text-xs text-slate-500 mt-1">Acompanhe atrasos em relação ao prazo final e monitore impedimentos que travam faturamentos nas plantas ou escritórios.</p>
            </div>
            
            <button
              onClick={() => setIsCreatingPendencia(!isCreatingPendencia)}
              className="text-xs font-bold px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Lançar Pendência Externa
            </button>
          </div>

          <AnimatePresence>
            {isCreatingPendencia && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-205 dark:border-slate-800 p-5 shadow-sm space-y-4"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
                  Designar Pendência Crítica
                </h3>

                <form onSubmit={handleRegisterPendencia} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Título / Assunto da Pendência *</label>
                    <input
                      type="text"
                      required
                      value={pendTitle}
                      onChange={(e) => setPendTitle(e.target.value)}
                      placeholder="Ex: Liberação de link de VPN Joinville"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Setor Técnico Destino</label>
                    <input
                      type="text"
                      value={pendSector}
                      onChange={(e) => setPendSector(e.target.value)}
                      placeholder="Ex: TI Core Sistemas, Logística Hub"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Prazo Estimado (SLA)</label>
                    <input
                      type="date"
                      value={pendDueDate}
                      onChange={(e) => setPendDueDate(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-xs font-bold text-slate-500">Detalhamento dos Bloqueios ou Impedimento</label>
                    <textarea
                      value={pendDescription}
                      onChange={(e) => setPendDescription(e.target.value)}
                      placeholder="Identifique quem causou e o impacto do atraso na fiação de Joinville ou faturamentos gerais..."
                      className="w-full text-xs h-16 bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 dark:text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Colaborador Dono do Acompanhamento</label>
                    <select
                      value={pendUserResp}
                      onChange={(e) => setPendUserResp(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-855 border rounded-lg p-2.5 dark:text-white outline-none cursor-pointer"
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Área Geográfica / Destino</label>
                    <input
                      type="text"
                      value={pendTargetArea}
                      onChange={(e) => setPendTargetArea(e.target.value)}
                      placeholder="Ex: Matriz Joinville ou Manaus"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-2.5 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Vincular a Projeto (Opcional)</label>
                    <select
                      value={pendProjectId}
                      onChange={(e) => setPendProjectId(e.target.value)}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-805 border rounded-lg p-2.5 dark:text-white cursor-pointer"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t text-xs">
                    <button
                      type="button"
                      onClick={() => setIsCreatingPendencia(false)}
                      className="px-4 py-2 font-bold bg-slate-100 dark:bg-slate-800 text-slate-655 rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg cursor-pointer"
                    >
                      Inserir no Tracker
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List Tracker for Issue queue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendencias.map(p => {
              const over = p.status !== 'Concluída' && isOverdue(p.dueDate);
              const responsibleUser = users.find(u => u.id === p.userResponsibleId);
              
              const statusColors = {
                'Pendente': 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-100',
                'Em Andamento': 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 border-blue-100',
                'Em Tratativa': 'bg-amber-50 dark:bg-amber-955/20 text-amber-600 border-amber-100',
                'Vencida': 'bg-red-100 text-red-600 border-red-200',
                'Concluída': 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-100'
              };

              return (
                <div 
                  key={p.id}
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs relative flex flex-col justify-between ${
                    over ? 'border-rose-400 dark:border-rose-900/40 bg-rose-50/5' : 'border-slate-205 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${over ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`} />
                        <span className="text-[10px] font-bold text-slate-400 font-sans uppercase">
                          SLA de Prazo: {new Date(p.dueDate).toLocaleDateString('pt-BR')} {over && '⚠️ ATRASADA'}
                        </span>
                      </div>
                      
                      <span className={`text-[9px] font-black border uppercase px-2 py-0.5 rounded ${statusColors[p.status]}`}>
                        {p.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-850 dark:text-white leading-tight">{p.title}</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed block">{p.description}</span>

                    <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-slate-450 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span>Setor Destinado:</span>
                        <span className="block text-slate-700 dark:text-slate-350">{p.sectorResponsible}</span>
                      </div>
                      <div>
                        <span>Área Geográfica:</span>
                        <span className="block text-slate-700 dark:text-slate-350">{p.targetArea}</span>
                      </div>
                      <div>
                        <span>Responsável:</span>
                        <span className="block text-indigo-505">{responsibleUser?.name || 'Staff'}</span>
                      </div>
                      <div>
                        <span>Criada em:</span>
                        <span className="block text-slate-405 leading-none">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Interaction buttons */}
                    <div className="pt-2 flex items-center gap-1">
                      {['Pendente', 'Em Tratativa', 'Concluída'].map(st => {
                        if (st === p.status) return null;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdatePendenciaStatus(p.id, st as any)}
                            className="text-[9px] font-bold px-2 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-600 dark:text-slate-350 rounded border transition-colors hover:border-indigo-500"
                          >
                            Para: {st}
                          </button>
                        );
                      })}
                    </div>

                    {/* History interactions listing */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] font-black block text-slate-400 uppercase tracking-widest leading-none mb-1">Linha de Interação Técnica</span>
                      
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1 bg-slate-50 dark:bg-slate-950/50 p-2 rounded-xl text-[10px] border border-transparent hover:border-slate-808">
                        {p.history?.map((h, idx) => (
                          <div key={idx} className="border-b border-dashed border-slate-105 dark:border-slate-850 pb-1 last:border-0 leading-tight">
                            <div className="flex justify-between items-center text-slate-400">
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">{h.userName}</span>
                              <span className="font-mono text-[8px]">{new Date(h.date).toLocaleDateString()}</span>
                            </div>
                            <span className="text-slate-600 dark:text-slate-300 block mt-0.5">{h.content}</span>
                          </div>
                        ))}
                      </div>

                      {/* Add History note */}
                      <form 
                        onSubmit={(e) => {
                          setSelectedPendencia(p);
                          handleAddPendHistory(e, p.id);
                        }}
                        className="flex gap-1 pt-1"
                      >
                        <input
                          type="text"
                          required
                          value={selectedPendencia?.id === p.id ? pendHistoryInput : ''}
                          onChange={(e) => {
                            setSelectedPendencia(p);
                            setPendHistoryInput(e.target.value);
                          }}
                          placeholder="Gravar nota técnica no histórico..."
                          className="flex-1 text-[11px] bg-slate-50 dark:bg-slate-808 text-slate-800 dark:text-white outline-none rounded p-1 border"
                        />
                        <button type="submit" className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer">
                          Nota
                        </button>
                      </form>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* AI Summary report modal */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-indigo-500/10">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2 bg-amber-500 text-white font-bold text-xs rounded-lg flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-white animate-spin" />
                    <span>IA COE</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm md:text-base pr-1">Boletim de Operações da Staff Britânia</h2>
                    <p className="text-[10px] text-slate-400">Sumarização em tempo real de logs de atividade</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-full"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* Modal content body */}
              <div className="p-6 overflow-y-auto space-y-4">
                {generatingSummary ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        O Gemini está lendo, traduzindo e consolidando os diários de bordo...
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">Metas de faturamento e cronometragem síncronas.</p>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-slate dark:prose-invert max-w-none text-xs leading-relaxed space-y-2">
                    {aiSummary ? renderSimpleMarkdown(aiSummary) : (
                      <p className="text-center text-slate-400 py-6">Nenhum dado retornado para consolidação.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Modal bottom actions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="text-xs font-bold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Fechar Boletim
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
