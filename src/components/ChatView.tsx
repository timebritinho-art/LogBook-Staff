import React, { useState, useEffect, useRef } from 'react';
import { AppApi } from '../services/api';
import { User, ChatMessage, Role, ChatChannel, Project, Task, Meeting, Pendencia, AuditLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  Send, Hash, MessageSquare, Search, Lock, Unlock, Clock, Folder, Tag, 
  Sparkles, History, FileText, ListTodo, HelpCircle, Activity, Briefcase, 
  Layers, Bot, ChevronRight, ChevronLeft, UserPlus, X, CheckSquare, Square, 
  AlertTriangle, Check, RefreshCw, BadgeInfo, ShieldAlert, Award
} from 'lucide-react';

interface ChatViewProps {
  currentUser: User | null;
  users: User[];
  chats: ChatMessage[];
  onRefreshChats: () => Promise<void>;
}

export default function ChatView({ currentUser, users, chats, onRefreshChats }: ChatViewProps) {
  // Sidebar states
  const [activeChannel, setActiveChannel] = useState('operacao');
  const [typedMessage, setTypedMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchMember, setSearchMember] = useState('');

  // Hub Loaded Data
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingHub, setLoadingHub] = useState(true);

  // Right Sidebars/Drawers
  const [showIntegrations, setShowIntegrations] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'integracoes' | 'ai'>('integracoes');

  // AI execution states
  const [loadingAi, setLoadingAi] = useState(false);
  const [glowingPromptUsed, setGlowingPromptUsed] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiHealthScore, setAiHealthScore] = useState<number | null>(null);

  // Channel Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChanName, setNewChanName] = useState('');
  const [newChanDesc, setNewChanDesc] = useState('');
  const [newChanType, setNewChanType] = useState<'projeto' | 'setor' | 'temporario' | 'privado'>('setor');
  const [newChanProjId, setNewChanProjId] = useState('');
  const [newChanSector, setNewChanSector] = useState('TI Core Sistemas');
  const [newChanPrivateUsers, setNewChanPrivateUsers] = useState<string[]>([]);
  const [newChanDuration, setNewChanDuration] = useState('24h');

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Load all dashboard operational records
  const fetchHubData = async () => {
    try {
      setLoadingHub(true);
      const [ch, pr, tk, mt, pd, lg] = await Promise.all([
        AppApi.getChannels(),
        AppApi.getProjects(),
        AppApi.getTasks(),
        AppApi.getMeetings(),
        AppApi.getPendencias(),
        AppApi.getAuditLogs()
      ]);
      setChannels(ch || []);
      setProjects(pr || []);
      setTasks(tk || []);
      setMeetings(mt || []);
      setPendencias(pd || []);
      setAuditLogs(lg || []);
      setLoadingHub(false);
    } catch (err) {
      console.error('Erro ao carregar dados integrados do chat:', err);
      setLoadingHub(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, []);

  // Poll chat messages and hub updates slightly slower to save engine cycles
  useEffect(() => {
    const chatInterval = setInterval(() => {
      onRefreshChats();
    }, 4500);
    return () => clearInterval(chatInterval);
  }, []);

  // Auto scroll chat to bottom when conversation changes or messages arrive
  const scrollToBottom = () => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, activeChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !currentUser) return;

    try {
      setLoading(true);
      const textToSend = typedMessage;
      setTypedMessage('');

      await AppApi.sendChatMessage(activeChannel, textToSend);
      await onRefreshChats();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setTypedMessage(prev => prev + emoji);
  };

  const handleMentionStaff = (nameString: string) => {
    setTypedMessage(prev => prev + ` @${nameString} `);
  };

  // Channel Creation submit
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChanName.trim()) return;

    try {
      setLoading(true);
      const formattedName = newChanName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      let finalAllowed = [...newChanPrivateUsers];
      if (currentUser && !finalAllowed.includes(currentUser.id)) {
        finalAllowed.push(currentUser.id);
      }

      let expiresAt: string | undefined = undefined;
      if (newChanType === 'temporario') {
        const hours = parseInt(newChanDuration);
        expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      }

      await AppApi.createChannel({
        name: formattedName,
        desc: newChanDesc || `Canal focado em ${newChanType}`,
        type: newChanType,
        projectId: newChanType === 'projeto' ? newChanProjId : undefined,
        sector: newChanType === 'setor' ? newChanSector : undefined,
        isPrivate: newChanType === 'privado',
        allowedUserIds: finalAllowed,
        expiresAt: expiresAt
      });

      // Clear layout
      setNewChanName('');
      setNewChanDesc('');
      setNewChanType('setor');
      setNewChanProjId('');
      setNewChanPrivateUsers([]);
      setShowCreateModal(false);

      // Refresh data
      await fetchHubData();
      setActiveChannel(formattedName);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao registrar canal:', err);
      setLoading(false);
    }
  };

  // Toggle dynamic task completion live inside the operational panel
  const handleToggleTaskStatus = async (task: Task) => {
    try {
      const isCompletedNow = task.status === 'Concluído';
      const changeTarget = isCompletedNow ? 'A Fazer' : 'Concluído';
      await AppApi.updateTask(task.id, { status: changeTarget });
      await fetchHubData();
      await onRefreshChats();
    } catch (err) {
      console.error('Falha ao atualizar status via hub chat:', err);
    }
  };

  // AI Commands Integration triggers
  const executeAiShortcut = async (actionType: string) => {
    try {
      setLoadingAi(true);
      setAiResult(null);
      setAiHealthScore(null);

      // Extract details about currently selected scope
      const currentChanObj = channels.find(c => c.id === activeChannel);
      const isProjectScope = currentChanObj?.type === 'projeto' || currentChanObj?.projectId;
      const linkedProjectId = currentChanObj?.projectId || 'proj-1';

      if (actionType === 'summarize-status') {
        setGlowingPromptUsed('Resumindo status operacional e progresso técnico do projeto...');
        const res = await AppApi.generateAiChatQuery(
          activeChannel, 
          'Gere um relatório estruturado de progresso e andamento técnico. Liste conquistas e a distribuição de tarefas no Quadro Kanban.'
        );
        setAiResult(res.response);
      } 
      else if (actionType === 'inform-pendencies') {
        setGlowingPromptUsed('Sondando pendências corporativas, impedimentos técnicos e responsabilidades...');
        const res = await AppApi.generateAiChatQuery(
          activeChannel, 
          'Sondagem detalhada de pendências rasteadas, gargalos técnicos na central de suporte e impedimentos. Quem está escalado para tratá-las?'
        );
        setAiResult(res.response);
      } 
      else if (actionType === 'next-steps') {
        setGlowingPromptUsed('Estipulando próximos passos estratégicos para o time de trabalho...');
        const res = await AppApi.generateAiChatQuery(
          activeChannel, 
          'Gere um cronograma ágil de próximos passos (3 a 5 ações pragmáticas de desenvolvimento) para mitigar atrasos baseado nestas tarefas.'
        );
        setAiResult(res.response);
      } 
      else if (actionType === 'action-plan') {
        setGlowingPromptUsed('Estruturando plano de ação avançado 5W2H para contorno de metas...');
        const res = await AppApi.generateAiChatQuery(
          activeChannel, 
          'Gere uma matriz 5W2H operacional (O que, Quem, Quando, Onde, Por que, Como, Quanto) para as demandas de maior criticidade no canal.'
        );
        setAiResult(res.response);
      } 
      else if (actionType === 'alert-risks') {
        setGlowingPromptUsed('Executando varredura analítica de riscos operacionais e estimativa de saúde (Health Meter)...');
        if (isProjectScope) {
          const res = await AppApi.generateAiRiskAlert(linkedProjectId);
          setAiResult(res.risks);
          setAiHealthScore(res.healthScore);
        } else {
          const res = await AppApi.generateAiChatQuery(
            activeChannel,
            'Quais são os principais riscos de atraso de cronograma, deadlocks concurrentes de banco ou barreira técnica no escopo global de hoje?'
          );
          setAiResult(res.response);
        }
      } 
      else if (actionType === 'show-bottlenecks') {
        setGlowingPromptUsed('Mapeando gargalos corporativos e concentração de alocação de analistas...');
        const res = await AppApi.generateAiChatQuery(
          activeChannel, 
          'Identifique e mapeie de forma objetiva gargalos (excesso de entregas acumuladas sob um único responsável, atividades em andamento sem atalhos ou atrasos de cronograma).'
        );
        setAiResult(res.response);
      } 
      else if (actionType === 'daily-summary') {
        setGlowingPromptUsed('Consolidando resumo operacional diário do Diário de Bordo...');
        const res = await AppApi.generateAiDailyBrief(currentUser?.id || 'u-1');
        setAiResult(res.brief);
      }

      setLoadingAi(false);
    } catch (err: any) {
      console.error('Falha na IA shortcut:', err);
      setAiResult(`### 🤖 Erro ao acionar a IA\n\nNão foi possível obter resposta integrada no momento: ${err.message || err}.`);
      setLoadingAi(false);
    }
  };

  const handleShareAiInChannel = async () => {
    if (!aiResult) return;
    try {
      setLoading(true);
      await AppApi.sendChatMessage(activeChannel, aiResult);
      await onRefreshChats();
      setAiResult(null);
      setAiHealthScore(null);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Filter dynamic channels active lists
  const currentChanObj = channels.find(c => c.id === activeChannel);
  const matchedProject = currentChanObj ? projects.find(p => p.id === currentChanObj.projectId || p.id === currentChanObj.id) : null;
  const matchedProjectId = matchedProject?.id;

  // Filter messages based on active channel ID
  const displayMessages = chats.filter(msg => msg.channel === activeChannel);

  // Security Access Validation
  const authorizedChannels = channels.filter(ch => {
    // Supervisao restrictions
    if (ch.id === 'supervisao' && currentUser?.role === 'Analista') {
      return false;
    }
    // Private checks
    if (ch.type === 'privado' || ch.isPrivate) {
      if (ch.allowedUserIds && ch.allowedUserIds.length > 0) {
        return ch.allowedUserIds.includes(currentUser?.id || '');
      }
    }
    return true;
  });

  // Split dynamic channels lists
  const globalChannels = authorizedChannels.filter(c => c.type === 'setor' || !c.type);
  const projectChannels = authorizedChannels.filter(c => c.type === 'projeto');
  const tempChannels = authorizedChannels.filter(c => c.type === 'temporario');
  const privateChannels = authorizedChannels.filter(c => c.type === 'privado' || c.isPrivate);

  // Filter members list by search query
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchMember.toLowerCase()) ||
    u.role.toLowerCase().includes(searchMember.toLowerCase())
  );

  // Filter Integration Items
  const filteredTasks = matchedProjectId 
    ? tasks.filter(t => t.projectId === matchedProjectId)
    : tasks.filter(t => t.priority === 'Crítica' || t.status === 'Em Andamento');

  const filteredPendencias = matchedProjectId
    ? pendencias.filter(p => p.projectId === matchedProjectId)
    : pendencias.filter(p => p.status !== 'Concluída');

  const filteredMeetings = matchedProjectId
    ? meetings.filter(m => m.projectId === matchedProjectId)
    : meetings.slice(0, 3);

  const filteredTimelineLogs = auditLogs.filter(log => {
    if (matchedProject) {
      return log.details.toLowerCase().includes(matchedProject.name.toLowerCase()) || log.targetId === matchedProject.id;
    }
    return true;
  }).slice(0, 5);

  return (
    <div className="bg-slate-50 dark:bg-slate-950/20 rounded-xl h-[78vh] flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto border border-slate-200 dark:border-slate-800 shadow-sm relative" id="chat-hub-view-root">
      
      {/* 1. SIDEBAR (Left Panel - Width W-60 to W-68) */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-1/3 md:h-full bg-white dark:bg-slate-900 overflow-hidden">
        
        {/* Sidebar Header Search */}
        <div className="p-3.5 border-b border-slate-150 dark:border-slate-800/80 shrink-0">
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder="Pesquisar canal ou equipe..."
              className="w-full text-[11px] pl-8 pr-32 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-200 rounded-lg outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Channels/Lists Flow */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
          
          {/* Create channel actionable button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 border border-dashed border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] bg-indigo-50/30 hover:bg-indigo-50 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20 rounded-lg transition-all cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Criar Canal Inteligente</span>
          </button>

          {/* Group: Globais / Setor */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between px-2 py-1 font-bold tracking-wide uppercase text-[9px] text-slate-400 dark:text-slate-500">
              <span>Canais de Discussão</span>
              <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-500">{globalChannels.length}</span>
            </div>
            {globalChannels.map(ch => {
              const isActive = activeChannel === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={`flex items-center gap-1.5 w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-805'
                  }`}
                >
                  <Hash className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-450' : 'text-slate-400'}`} />
                  <span className="truncate">{ch.name}</span>
                </button>
              );
            })}
          </div>

          {/* Group: Projetos */}
          {projectChannels.length > 0 && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between px-2 py-1 font-bold tracking-wide uppercase text-[9px] text-slate-400 dark:text-slate-500">
                <span>Canais por Projeto</span>
                <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-500">{projectChannels.length}</span>
              </div>
              {projectChannels.map(ch => {
                const isActive = activeChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className={`flex items-center gap-1.5 w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 font-bold' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-805'
                    }`}
                  >
                    <Briefcase className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <span className="truncate">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Group: Temporários */}
          {tempChannels.length > 0 && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between px-2 py-1 font-bold tracking-wide uppercase text-[9px] text-slate-400 dark:text-slate-500">
                <span>Discussões Temporárias</span>
                <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-500">{tempChannels.length}</span>
              </div>
              {tempChannels.map(ch => {
                const isActive = activeChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className={`flex items-center gap-1.5 w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      isActive 
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 font-bold' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-805'
                    }`}
                  >
                    <Clock className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-amber-600 dark:text-amber-450' : 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate leading-none">{ch.name}</p>
                      <p className="text-[8px] text-slate-400 truncate mt-0.5">Expira em breve</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Group: Privados */}
          {privateChannels.length > 0 && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between px-2 py-1 font-bold tracking-wide uppercase text-[9px] text-slate-400 dark:text-slate-500">
                <span>Canais Privados 🔒</span>
                <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-500">{privateChannels.length}</span>
              </div>
              {privateChannels.map(ch => {
                const isActive = activeChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className={`flex items-center gap-1.5 w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      isActive 
                        ? 'bg-rose-55 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 font-bold' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-805'
                    }`}
                  >
                    <Lock className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-rose-600 dark:text-rose-450' : 'text-slate-400'}`} />
                    <span className="truncate">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Group: Members */}
          <div className="pt-2 border-t border-slate-150 dark:border-slate-800">
            <div className="flex items-center justify-between px-2 py-1 font-bold tracking-wide uppercase text-[9px] text-slate-400 dark:text-slate-500">
              <span>Equipe Online ({users.length})</span>
            </div>
            <div className="space-y-0.5 font-sans">
              {filteredUsers.slice(0, 6).map(u => {
                const statusColors = {
                  'Online': 'bg-emerald-500',
                  'Ocupado': 'bg-rose-500',
                  'Ausente': 'bg-amber-500',
                  'Offline': 'bg-slate-400'
                };

                return (
                  <div
                    key={u.id}
                    onClick={() => handleMentionStaff(u.name)}
                    className="flex items-center justify-between p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg cursor-pointer group"
                    title="Clique para mencionar este membro no chat"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative shrink-0">
                        <img 
                          src={u.avatar} 
                          alt={u.name} 
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white dark:border-slate-900 ${statusColors[u.status] || 'bg-slate-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-700 dark:text-slate-350 font-bold leading-tight block truncate max-w-[120px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{u.name}</span>
                      </div>
                    </div>
                    <span className="text-[8px] text-slate-400 group-hover:opacity-100 opacity-0 transition-opacity">Mencionar</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* 2. CHAT STREAM BOARD (Center Area - Flex-1) */}
      <div className="flex-1 flex flex-col h-2/3 md:h-full bg-slate-50/50 dark:bg-slate-950/10 min-w-0">
        
        {/* Chat Active Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded text-indigo-600 dark:text-indigo-455">
              {currentChanObj?.type === 'projeto' ? (
                <Briefcase className="h-4 w-4" />
              ) : currentChanObj?.type === 'privado' ? (
                <Lock className="h-4 w-4" />
              ) : currentChanObj?.type === 'temporario' ? (
                <Clock className="h-4 w-4" />
              ) : (
                <Hash className="h-4 w-4" />
              )}
            </div>
            
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-xs md:text-sm tracking-tight leading-none">
                #{currentChanObj?.name || activeChannel}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 truncate max-w-xs md:max-w-md">
                {currentChanObj?.desc || 'Hub de discussão integrada'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Integrations / AI Panel */}
            <button
              onClick={() => {
                setShowIntegrations(prev => !prev);
              }}
              className={`flex items-center gap-1.5 font-bold text-[10px] px-2.5 py-1.5 rounded-lg border shadow-3xs cursor-pointer transition-all ${
                showIntegrations 
                  ? 'bg-indigo-600 text-white border-indigo-600' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-220 dark:border-slate-800'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Painel de Integrações</span>
            </button>
          </div>
        </div>

        {/* Tip Indicator */}
        <div className="px-4 py-1.5 bg-indigo-50/40 dark:bg-indigo-950/10 text-[9px] text-slate-500 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/20 shrink-0 select-none">
          <BadgeInfo className="h-3.5 w-3.5 text-indigo-500" />
          <span>Mencione <strong>@ia ou @gemini</strong> na caixa de texto para obter respostas de assessoria de bordo em tempo real!</span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20">
          
          <AnimatePresence initial={false}>
            {displayMessages.map(msg => {
              const isMine = msg.userId === currentUser?.id;
              const isBot = msg.userId === 'u-bot';
              
              let bubbleCls = "flex flex-col space-y-1 w-full ";
              if (isMine) {
                bubbleCls += "items-end";
              } else {
                bubbleCls += "items-start";
              }

              const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 'h';

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={bubbleCls}
                >
                  
                  {/* Meta tag */}
                  {!isMine && (
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 ml-1 pb-0.5">
                      <span className={isBot ? "text-amber-500 dark:text-amber-400 font-black flex items-center gap-0.5" : "text-slate-700 dark:text-slate-300"}>
                        {isBot ? '✨ Gemini Assistente' : msg.userName}
                      </span>
                      <span className={`text-[8px] px-1 py-0.1 select-none rounded ${
                        isBot ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {msg.userRole}
                      </span>
                      <span className="text-slate-400 font-normal">{formattedTime}</span>
                    </div>
                  )}

                  {isMine && (
                    <span className="text-[8px] text-slate-400 mr-1.5">{formattedTime}</span>
                  )}

                  {/* Bubble Canvas */}
                  <div className={`max-w-[85%] rounded-xl p-3 shadow-3xs text-left ${
                    isBot 
                      ? "bg-amber-50/80 dark:bg-slate-900 border-l-4 border-l-amber-500 text-slate-800 dark:text-slate-200"
                      : isMine
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                  }`}>
                    {isBot ? (
                      <div className="markdown-body prose dark:prose-invert text-[11px] font-medium leading-relaxed max-w-none">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap font-sans font-medium">
                        {msg.content}
                      </p>
                    )}
                  </div>

                </motion.div>
              );
            })}

            {displayMessages.length === 0 && (
              <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                <MessageSquare className="h-8 w-8 text-slate-300" />
                <p>Nenhuma mensagem operacional registrada no canal de #{currentChanObj?.name || activeChannel}.</p>
                <p className="text-[10px] text-slate-300 max-w-xs">Qualquer menção ou status report será gravado e transmitido aqui para a coordenação.</p>
              </div>
            )}
          </AnimatePresence>

          <div ref={chatBottomRef} />
        </div>

        {/* Input Message panel */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-850">
            
            <button
              type="button"
              onClick={() => handleAddEmoji('👍')}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-xs select-none rounded-full cursor-pointer"
              title="Emoji 👍"
            >
              👍
            </button>
            <button
              type="button"
              onClick={() => handleAddEmoji('⚠️')}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-xs select-none rounded-full cursor-pointer"
              title="Emoji ⚠️"
            >
              ⚠️
            </button>
            <button
              type="button"
              onClick={() => handleAddEmoji('✅')}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-xs select-none rounded-full cursor-pointer"
              title="Emoji ✅"
            >
              ✅
            </button>

            <span className="w-px h-5 bg-slate-200 dark:bg-slate-850 shrink-0 mx-1" />

            <input
              type="text"
              value={typedMessage}
              required
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Pergunte aos analistas operacionais ou mencione @ia..."
              className="flex-1 bg-transparent border-transparent select-none outline-none text-xs text-slate-900 dark:text-white py-1.5 focus:ring-0 placeholder-slate-450"
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-lg scroll-smooth cursor-pointer shrink-0 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>

          </form>
        </div>

      </div>

      {/* 3. INTEGRATION OPERATIONAL DRAWER (Right Sidebar - Width W-72 to W-80) */}
      <AnimatePresence>
        {showIntegrations && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '22rem', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 w-full md:w-88 h-1/3 md:h-full bg-white dark:bg-slate-900 flex flex-col shrink-0 overflow-hidden relative"
          >
            {/* Headers Tabs selector */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 select-none text-[11px] font-bold shrink-0">
              <button
                onClick={() => setActiveSidebarTab('integracoes')}
                className={`flex-1 py-3 text-center border-b-2 cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  activeSidebarTab === 'integracoes'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Fluxo Sincronizado</span>
              </button>
              
              <button
                onClick={() => setActiveSidebarTab('ai')}
                className={`flex-1 py-3 text-center border-b-2 cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  activeSidebarTab === 'ai'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                }`}
              >
                <Bot className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                <span>Inteligência IA</span>
              </button>
            </div>

            {/* Sidebar Scroll Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              
              {/* TAB 1: INTEGRATION FLOW */}
              {activeSidebarTab === 'integracoes' && (
                <div className="space-y-4">
                  
                  {/* Scope description */}
                  <div className="p-3 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/10 rounded-lg">
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>{matchedProject ? 'PROJETO INTEGRADO' : 'MAQUETE GERAL STAFF'}</span>
                    </p>
                    <h4 className="text-xs font-extrabold text-slate-805 dark:text-slate-200 mt-0.5">
                      {matchedProject ? matchedProject.name : 'Integração Global'}
                    </h4>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">
                      Setor: {matchedProject ? matchedProject.sector : 'Todo Staff Técnico'} • Prazo: {matchedProject ? matchedProject.dueDate : 'SLA Diário'}
                    </p>
                  </div>

                  {/* SUBSECTION: KANBAN TASKS INTEGRATION */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        <ListTodo className="h-3.5 w-3.5 text-slate-400" />
                        <span>Tarefas do Kanban ({filteredTasks.length})</span>
                      </h5>
                    </div>

                    <div className="space-y-1 max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-800 p-1 bg-slate-50/30 dark:bg-slate-950/40 rounded-lg">
                      {filteredTasks.map(t => {
                        const isDone = t.status === 'Concluído';
                        return (
                          <div 
                            key={t.id} 
                            className="flex items-start gap-1.5 p-1.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/60 rounded text-[10px] hover:border-indigo-400 hover:shadow-2xs transition-all"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleTaskStatus(t)}
                              className="text-slate-400 hover:text-indigo-600 mt-0.5 cursor-pointer"
                              title={isDone ? 'Reabrir tarefa' : 'Concluir tarefa'}
                            >
                              {isDone ? (
                                <CheckSquare className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <Square className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold transition-all truncate text-slate-800 dark:text-slate-200 ${isDone ? 'line-through text-slate-400' : ''}`}>
                                {t.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[8px] text-slate-400">
                                <span className={`px-1 py-0.1 font-bold text-[8px] rounded ${
                                  t.priority === 'Crítica' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-450' : 
                                  t.priority === 'Alta' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-450' :
                                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-450'
                                }`}>
                                  {t.priority}
                                </span>
                                <span>{t.status}</span>
                                {t.dueDate && (
                                  <span className="text-slate-410">Vencimento: {t.dueDate}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {filteredTasks.length === 0 && (
                        <p className="text-[10.5px] text-center text-slate-400 p-4">Sem tarefas direcionadas</p>
                      )}
                    </div>
                  </div>

                  {/* SUBSECTION: PENDENCIAS / IMPEDIMENTOS */}
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                      <span>Impedimentos & Pendências ({filteredPendencias.length})</span>
                    </h5>
                    
                    <div className="space-y-1 max-h-32 overflow-y-auto border border-slate-105 dark:border-slate-820 p-1 bg-slate-50/30 dark:bg-slate-950/40 rounded-lg">
                      {filteredPendencias.map(p => {
                        const isOverdue = p.dueDate && new Date(p.dueDate) < new Date();
                        return (
                          <div 
                            key={p.id}
                            className="bg-white dark:bg-slate-900 hover:border-indigo-400 border border-slate-150 dark:border-slate-800 p-2 rounded text-[10px] space-y-1"
                          >
                            <div className="flex items-start justify-between">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate pr-2">{p.title}</span>
                              <span className={`px-1 rounded font-bold text-[8px] shrink-0 ${
                                p.status === 'Concluída' 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/25 dark:text-rose-400'
                              }`}>
                                {p.status}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-tight">{p.description}</p>
                            <div className="flex items-center justify-between text-[8px] text-slate-400 pt-0.5">
                              <span>Setor: {p.sectorResponsible}</span>
                              <span className={isOverdue ? "text-rose-600 font-bold" : ""}>Prazo: {p.dueDate || 'Imediato'}</span>
                            </div>
                          </div>
                        );
                      })}

                      {filteredPendencias.length === 0 && (
                        <p className="text-[10.5px] text-center text-slate-400 p-4">Nenhum impedimento travando faturamento ou entrega.</p>
                      )}
                    </div>
                  </div>

                  {/* SUBSECTION: MEETINGS */}
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Atas de Reuniões Sincronizadas ({filteredMeetings.length})</span>
                    </h5>

                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {filteredMeetings.map(m => (
                        <div 
                          key={m.id}
                          className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 p-2 rounded text-[10px] space-y-0.5"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-750 dark:text-slate-300">
                            <span className="truncate max-w-[180px]">{m.title}</span>
                            <span className="text-[8px] bg-slate-250 dark:bg-slate-800 px-1 rounded text-slate-500">{m.date}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-tight truncate">{m.objective}</p>
                        </div>
                      ))}

                      {filteredMeetings.length === 0 && (
                        <p className="text-[10.5px] text-center text-slate-400 p-2">Sem reuniões de alinhamento marcadas</p>
                      )}
                    </div>
                  </div>

                  {/* SUBSECTION: PROJECT TIMELINE UPDATES */}
                  <div className="space-y-2 pt-1">
                    <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      <History className="h-3.5 w-3.5 text-slate-400" />
                      <span>Feed de Mudanças e Atualizações</span>
                    </h5>

                    <div className="border-l border-indigo-150 dark:border-indigo-900 pl-3.5 ml-1.5 space-y-3 relative text-[9px]">
                      {filteredTimelineLogs.map(log => (
                        <div key={log.id} className="relative leading-tight">
                          <span className="absolute -left-[19.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-indigo-505 dark:bg-indigo-400 border border-indigo-100" />
                          <p className="font-bold text-slate-800 dark:text-slate-250">{log.action}</p>
                          <p className="text-slate-405">{log.details}</p>
                          <p className="text-[8px] text-slate-400 mt-0.5 block">{new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit' })} às {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ))}

                      {filteredTimelineLogs.length === 0 && (
                        <p className="text-[10.5px] text-slate-400 pl-2">Nenhum evento registrado no feed.</p>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: AI COMMANDS */}
              {activeSidebarTab === 'ai' && (
                <div className="space-y-4">
                  
                  {/* AI Intro Header */}
                  <div className="p-3 bg-indigo-50 inline-block border border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400 rounded-lg w-full">
                    <div className="flex items-center gap-1.5">
                      <Bot className="h-5 w-5 text-indigo-500" />
                      <span className="text-xs font-black tracking-tight uppercase">Mesa Cooperativa Gemini</span>
                    </div>
                    <p className="text-[10px] mt-1 leading-relaxed text-slate-500">
                      Dispare comandos inteligentes e acione a IA para analisar o Diário de Bordo, alertar gargalos e estruturar planos táticos de ação.
                    </p>
                  </div>

                  {/* Clickable IA Command Buttons */}
                  <div className="grid grid-cols-1 gap-1.5">
                    
                    <button
                      onClick={() => executeAiShortcut('summarize-status')}
                      disabled={loadingAi}
                      className="flex items-center gap-2 text-left p-2.5 bg-slate-50 hover:bg-indigo-50/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-250 cursor-pointer transition-all"
                    >
                      <Sparkles className="h-4 w-4 text-indigo-500 select-none" />
                      <div>
                        <span>Status e Progresso</span>
                        <p className="text-[8.5px] text-slate-400 font-normal">Resumir andamento e tarefas no Kanban</p>
                      </div>
                    </button>

                    <button
                      onClick={() => executeAiShortcut('inform-pendencies')}
                      disabled={loadingAi}
                      className="flex items-center gap-2 text-left p-2.5 bg-slate-50 hover:bg-slate-100 hover:bg-indigo-50/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-805 dark:text-slate-250 cursor-pointer transition-all"
                    >
                      <HelpCircle className="h-4 w-4 text-amber-500 select-none" />
                      <div>
                        <span>Sondar Pendências</span>
                        <p className="text-[8.5px] text-slate-400 font-normal">Listar impedimentos e bloqueadores técnicos</p>
                      </div>
                    </button>

                    <button
                      onClick={() => executeAiShortcut('next-steps')}
                      disabled={loadingAi}
                      className="flex items-center gap-2 text-left p-2.5 bg-slate-50 hover:bg-slate-100 hover:bg-indigo-50/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-805 dark:text-slate-250 cursor-pointer transition-all"
                    >
                      <ChevronRight className="h-4 w-4 text-emerald-505 select-none" />
                      <div>
                        <span>Próximos Passos</span>
                        <p className="text-[8.5px] text-slate-400 font-normal">Gerar roadmap rápido de ações consecutivas</p>
                      </div>
                    </button>

                    <button
                      onClick={() => executeAiShortcut('action-plan')}
                      disabled={loadingAi}
                      className="flex items-center gap-2 text-left p-2.5 bg-slate-50 hover:bg-slate-150 hover:bg-indigo-50/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-805 dark:text-slate-250 cursor-pointer transition-all"
                    >
                      <FileText className="h-4 w-4 text-blue-500 select-none" />
                      <div>
                        <span>Matriz 5W2H Tática</span>
                        <p className="text-[8.5px] text-slate-400 font-normal">Sugerir plano estratégico completo</p>
                      </div>
                    </button>

                    <button
                      onClick={() => executeAiShortcut('alert-risks')}
                      disabled={loadingAi}
                      className="flex items-center gap-2 text-left p-2.5 bg-slate-50 hover:bg-indigo-50/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-805 dark:text-slate-250 cursor-pointer transition-all"
                    >
                      <AlertTriangle className="h-4 w-4 text-rose-500 select-none" />
                      <div>
                        <span>Alertas e Saúde 🚨</span>
                        <p className="text-[8.5px] text-slate-400 font-normal">Medir saúde de entrega e riscos fiscais/SLA</p>
                      </div>
                    </button>

                    <button
                      onClick={() => executeAiShortcut('show-bottlenecks')}
                      disabled={loadingAi}
                      className="flex items-center gap-2 text-left p-2.5 bg-slate-50 hover:bg-indigo-50/40 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-bold text-slate-805 dark:text-slate-250 cursor-pointer transition-all"
                    >
                      <Activity className="h-4 w-4 text-fuchsia-500 select-none" />
                      <div>
                        <span>Mapear Gargalos</span>
                        <p className="text-[8.5px] text-slate-400 font-normal">Identificar gargalos de equipe acumulados</p>
                      </div>
                    </button>

                    <button
                      onClick={() => executeAiShortcut('daily-summary')}
                      disabled={loadingAi}
                      className="flex items-center gap-2 text-left p-2.5 bg-indigo-600 hover:bg-indigo-700 hover:bg-indigo-50/40 dark:bg-indigo-950 border border-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                    >
                      <Award className="h-4 w-4 text-amber-300 select-none animate-pulse" />
                      <div>
                        <span>Painel Operacional Diário</span>
                        <p className="text-[8.5px] text-indigo-100 dark:text-slate-400 font-normal">Resumo do Diário de Bordo do dia corrente</p>
                      </div>
                    </button>

                  </div>

                  {/* Execution Loader Feedback */}
                  {loadingAi && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-indigo-150 rounded-lg text-center space-y-2 animate-pulse">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-250">Conectando ao Modelo Gemini 2.5...</p>
                      <p className="text-[9px] text-slate-400">{glowingPromptUsed}</p>
                    </div>
                  )}

                  {/* Rendered AI Insight Text Result */}
                  {aiResult && (
                    <div className="bg-amber-50/65 dark:bg-slate-900/50 p-3.5 border border-amber-200/50 rounded-xl space-y-3">
                      
                      {/* Health scoring indicator */}
                      {aiHealthScore !== null && (
                        <div className="p-2.5 bg-slate-900/90 rounded-lg flex items-center justify-between text-white">
                          <span className="text-[10px] font-bold">PONTUAÇÃO SAÚDE PROJETO:</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className={`h-2.5 w-2.5 rounded-full ${aiHealthScore > 75 ? 'bg-emerald-500' : aiHealthScore > 45 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                            <span className="text-xs">{aiHealthScore}/100</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between select-none">
                        <span className="text-[9px] uppercase font-bold text-amber-700 dark:text-amber-400">Análise Completa Gerada</span>
                        <span className="text-[8px] color-slate bg-amber-100 dark:bg-amber-900 px-1 py-0.2 rounded font-semibold text-amber-700 dark:text-amber-400">Gemini Pro</span>
                      </div>

                      <div className="markdown-body prose dark:prose-invert text-[10.5px] text-slate-700 dark:text-slate-350 leading-relaxed font-medium">
                        <Markdown>{aiResult}</Markdown>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-850 select-none">
                        <button
                          onClick={handleShareAiInChannel}
                          className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Send className="h-3 w-3" />
                          <span>🚀 Compartilhar no Canal</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(aiResult || '');
                            alert('Copiado para a área de transferência!');
                          }}
                          className="py-1.5 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-250 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-250 font-semibold text-[10px] rounded-lg transition-colors cursor-pointer"
                        >
                          Copiar
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. CHANNELS CREATION OVERLAY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 select-none" id="create-channel-modal">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg w-full max-w-sm overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-white">
                <Layers className="h-4 w-4 text-indigo-550" />
                <span className="text-xs font-black">Criar Canal Operativo</span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateChannel} className="p-4 space-y-3.5">
              
              {/* Type Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Tipo de Canal Inteligente</label>
                <select
                  value={newChanType}
                  onChange={(e) => setNewChanType(e.target.value as any)}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                >
                  <option value="setor">Canais Setoriais / Discussão Geral</option>
                  <option value="projeto">Canais de Projeto (Kanban Integrado)</option>
                  <option value="temporario">Canais Temporários (Expira no Cronômetro) ⏱️</option>
                  <option value="privado">Canais Privados (Seguro e Restrito) 🔒</option>
                </select>
              </div>

              {/* Channel name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Nome do Canal</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 py-0.5 text-xs text-slate-400 font-extrabold select-none">#</span>
                  <input
                    type="text"
                    value={newChanName}
                    required
                    onChange={(e) => setNewChanName(e.target.value)}
                    placeholder="ex: sap-homologacao-faturamento"
                    className="w-full text-xs pl-6 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Channel Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Descrição Técnica</label>
                <input
                  type="text"
                  value={newChanDesc}
                  onChange={(e) => setNewChanDesc(e.target.value)}
                  placeholder="ex: Monitoramento e incidentes SAP"
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              {/* Conditional options for PROJECT */}
              {newChanType === 'projeto' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Vincular Projeto Ativo</label>
                  <select
                    value={newChanProjId}
                    onChange={(e) => setNewChanProjId(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">Selecione um projeto...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} • (Setor: {p.sector})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional options for SECTOR */}
              {newChanType === 'setor' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Selecione o Setor Responsável</label>
                  <select
                    value={newChanSector}
                    onChange={(e) => setNewChanSector(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="TI Core Sistemas">TI Core Sistemas</option>
                    <option value="Logística">Logística</option>
                    <option value="Operações">Operações</option>
                    <option value="Faturamento">Faturamento</option>
                    <option value="Gestão">Gestão</option>
                  </select>
                </div>
              )}

              {/* Conditional options for TEMPORARY */}
              {newChanType === 'temporario' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Duração (Expiração Assistida)</label>
                  <select
                    value={newChanDuration}
                    onChange={(e) => setNewChanDuration(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-805 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="1h">Expira em 1 hora</option>
                    <option value="12h">Expira em 12 horas</option>
                    <option value="24h">Expira em 24 horas</option>
                    <option value="72h">Expira em 3 dias</option>
                    <option value="168h">Expira em 1 semana</option>
                  </select>
                </div>
              )}

              {/* Conditional options for PRIVATE */}
              {newChanType === 'privado' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase select-none">Membros com Acesso Exclusivo</label>
                  <div className="space-y-1 max-h-24 overflow-y-auto border border-slate-200 dark:border-slate-850 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-lg">
                    {users.map(u => {
                      const isSelected = newChanPrivateUsers.includes(u.id);
                      return (
                        <div 
                          key={u.id}
                          onClick={() => {
                            if (isSelected) {
                              setNewChanPrivateUsers(prev => prev.filter(id => id !== u.id));
                            } else {
                              setNewChanPrivateUsers(prev => [...prev, u.id]);
                            }
                          }}
                          className="flex items-center gap-2 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer text-[10.5px]"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-indigo-600 focus:ring-0"
                          />
                          <img src={u.avatar} alt="avatar" className="w-4 h-4 rounded-full object-cover" />
                          <span className="font-bold text-slate-750 dark:text-slate-350">{u.name} ({u.role})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-150 dark:border-slate-800 select-none">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 text-center bg-slate-50 text-slate-600 dark:bg-slate-850 dark:text-slate-300 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 text-center bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Confirmar Criação
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
