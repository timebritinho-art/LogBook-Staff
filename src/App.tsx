import React, { useState, useEffect } from 'react';
import { AppApi } from './services/api';
import { User, Project, Task, DiarioEntry, CalendarEvent, ChatMessage, AuditLog } from './types';
import DashboardView from './components/DashboardView';
import DiarioView from './components/DiarioView';
import KanbanView from './components/KanbanView';
import CalendarView from './components/CalendarView';
import ChatView from './components/ChatView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import { 
  BookOpen, LayoutDashboard, Layers, Calendar, MessageSquare, 
  FileSpreadsheet, Settings, LogOut, Sun, Moon, Play, Pause, 
  RotateCw, PlusCircle, CheckCircle, ShieldAlert, Wifi, Zap, Clock 
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [diaries, setDiaries] = useState<DiarioEntry[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'diario' | 'kanban' | 'calendar' | 'chat' | 'reports' | 'settings'>('dashboard');

  // Unified global Theme state (Light/Dark mode)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Stopwatch state
  const [stopwatchActive, setStopwatchActive] = useState(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [stopwatchTaskId, setStopwatchTaskId] = useState('');
  const [stopwatchTimerId, setStopwatchTimerId] = useState<NodeJS.Timeout | null>(null);

  // Load backend data after simulated authentication succeeds
  const loadAllSystemData = async () => {
    try {
      const [u, p, t, d, c, e, l] = await Promise.all([
        AppApi.getUsers(),
        AppApi.getProjects(),
        AppApi.getTasks(),
        AppApi.getDiaries(),
        AppApi.getChats(),
        AppApi.getEvents(),
        AppApi.getLogs()
      ]);

      setUsers(u);
      setProjects(p);
      setTasks(t);
      setDiaries(d);
      setChats(c);
      setEvents(e);
      setLogs(l);

      // Restore active user if saved in localStorage
      const savedUser = localStorage.getItem('britania_staff_user');
      if (savedUser) {
        const found = u.find(x => x.id === savedUser);
        if (found) {
          setCurrentUser(found);
          AppApi.simulateLogin(found.id);
        } else {
          setCurrentUser(u[0]);
          AppApi.simulateLogin(u[0].id);
        }
      } else {
        // Default login initially
        setCurrentUser(u[0]);
        AppApi.simulateLogin(u[0].id);
      }
    } catch (err) {
      console.error('Falha carregando dados do Diário de Bordo:', err);
    }
  };

  useEffect(() => {
    loadAllSystemData();
  }, []);

  // Sync theme class on mount and theme state modifications
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Stopwatch interval timer scheduler
  useEffect(() => {
    let interval: any = null;
    if (stopwatchActive) {
      interval = setInterval(() => {
        setStopwatchSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [stopwatchActive]);

  const handleSelectUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      AppApi.simulateLogin(userId);
      localStorage.setItem('britania_staff_user', userId);
      // Log event
      AppApi.createAuditLog('Autenticação', 'Usuário', `Login simulado efetuado como ${found.name}`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('britania_staff_user');
  };

  // Stopwatch Actions
  const startStopwatch = () => {
    setStopwatchActive(true);
    // Log audit
    AppApi.createAuditLog('Cronômetro', 'Tarefa', `Cronômetro de produtividade iniciado.`);
  };

  const pauseStopwatch = () => {
    setStopwatchActive(false);
  };

  const resetStopwatch = () => {
    setStopwatchActive(false);
    setStopwatchSeconds(0);
  };

  const formatStopwatchTime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopAndSaveToDiary = async () => {
    if (stopwatchSeconds < 10) {
      alert('Por favor, trabalhe pelo menos 10 segundos antes de arquivar este log no diário.');
      return;
    }

    const linkedTaskDetails = tasks.find(t => t.id === stopwatchTaskId);
    const taskTitle = linkedTaskDetails ? linkedTaskDetails.title : 'Atividade Operacional Assistida';
    const projId = linkedTaskDetails ? linkedTaskDetails.projectId : (projects[0]?.id || 'p-1');

    try {
      await AppApi.createDiary({
        projectId: projId,
        category: 'Desenvolvimento',
        performedText: `Atividade realizada via Cronômetro de Produtividade do Time Britânia:\n- ${taskTitle}`,
        problemsText: '',
        completedDemands: linkedTaskDetails?.title || '',
        observations: `Tempo medido via cronômetro operacional.`,
        status: 'Estável',
        pendingText: '',
        nextSteps: '',
        timeSpentSeconds: stopwatchSeconds,
        tags: ['Cronômetro', 'Produtividade'],
        date: new Date().toISOString().split('T')[0]
      });

      // Clear stopwatch
      setStopwatchActive(false);
      setStopwatchSeconds(0);
      setStopwatchTaskId('');

      alert('Tempo cronometrado adicionado com sucesso no seu Diário de Bordo!');
      
      // Reload reports data
      const [d, l] = await Promise.all([AppApi.getDiaries(), AppApi.getLogs()]);
      setDiaries(d);
      setLogs(l);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans transition-colors duration-250 flex flex-col">
      
      {/* If user not logged in, show elegant Login Gate selector */}
      {!currentUser ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden space-y-6">
            
            {/* Top aesthetic headers */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-red-600/20 active:rotate-12 transition-transform select-none">
                <span className="font-sans font-black text-white text-lg tracking-wider">B</span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Diário de Bordo Staff Britânia
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione seu perfil operacional para ingressar no painel de conciliação.
              </p>
            </div>

            {/* List selector */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block select-none">Ingressar no Perfil</label>
              
              <div className="grid grid-cols-1 gap-2">
                {users.map(u => {
                  const roleColors = {
                    'Analista': 'border-l-sky-400 bg-sky-500/5',
                    'Supervisor': 'border-l-amber-55 bg-amber-500/5',
                    'Gestão': 'border-l-rose-500 bg-rose-500/5'
                  };

                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u.id)}
                      className={`w-full p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-left rounded-xl border border-slate-205 dark:border-slate-750 flex items-center gap-3 transition-colors shrink-0 cursor-pointer border-l-4 ${
                        roleColors[u.role] || ''
                      }`}
                    >
                      <img 
                        src={u.avatar} 
                        alt={u.name} 
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <strong className="text-xs text-slate-800 dark:text-slate-200 truncate block max-w-[200px]">{u.name}</strong>
                        <span className="text-[10px] text-slate-500">{u.role}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulated footer cred */}
            <div className="text-center pt-2 text-[10px] text-slate-405 flex items-center justify-center gap-1 border-t border-slate-100 dark:border-slate-800">
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              <span>Conexão Segura Integrada</span>
            </div>

          </div>
        </div>
      ) : (
        <>
          {/* Main system header toolbar bar */}
          <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-xs shadow-xs">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
              
              {/* App launcher brand info */}
              <div className="flex items-center gap-3 select-none">
                <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all">
                  <span className="font-sans font-black text-white text-md">B</span>
                </div>
                <div>
                  <h1 className="font-black text-slate-900 dark:text-white text-sm md:text-md tracking-tight uppercase leading-none">
                    Britânia
                  </h1>
                  <span className="text-[9px] text-red-500 tracking-wider font-bold uppercase leading-none mt-0.5 block">
                    Diário de Bordo Staff
                  </span>
                </div>
              </div>

              {/* Central Quick navigation menus */}
              <nav className="hidden lg:flex items-center gap-1 text-xs">
                
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Painel Geral
                </button>

                <button
                  onClick={() => setActiveTab('diario')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTab === 'diario'
                      ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Diário de Bordo
                </button>

                <button
                  onClick={() => setActiveTab('kanban')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTab === 'kanban'
                      ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  Kanban
                </button>

                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTab === 'calendar'
                      ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Calendário
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTab === 'chat'
                      ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-450'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </button>

                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTab === 'reports'
                      ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Relatórios
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Gestão & Logs
                </button>

              </nav>

              {/* Utility actions on right side */}
              <div className="flex items-center gap-3">
                
                {/* Theme toggle slider buttons */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-pointer"
                  title="Mudar visual (Luz / Escuro)"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
                </button>

                {/* Profile switch panel */}
                <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
                  
                  {/* Micro role dropdown choice */}
                  <select
                    value={currentUser.id}
                    onChange={(e) => handleSelectUser(e.target.value)}
                    className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg p-1.5 outline-none font-bold max-w-44 select-none cursor-pointer"
                    title="Alternar Perfil em Processamento"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>

                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    referrerPolicy="no-referrer"
                    title={currentUser.name}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                  />

                  <button
                    onClick={handleLogout}
                    className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded cursor-pointer shrink-0"
                    title="Logout do Sistema"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>

                </div>

              </div>

            </div>
          </header>

          {/* Lower sub-navigation menu for mobile devices */}
          <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-30 select-none overflow-x-auto">
            <div className="flex items-center px-4 h-11 pointer-events-auto shrink-0 gap-1 text-[11px] whitespace-nowrap">
              
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg font-bold ${activeTab === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400' : 'text-slate-500'}`}
              >
                Painel
              </button>

              <button
                onClick={() => setActiveTab('diario')}
                className={`px-3 py-1.5 rounded-lg font-bold ${activeTab === 'diario' ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400' : 'text-slate-500'}`}
              >
                Diário
              </button>

              <button
                onClick={() => setActiveTab('kanban')}
                className={`px-3 py-1.5 rounded-lg font-bold ${activeTab === 'kanban' ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400' : 'text-slate-500'}`}
              >
                Kanban
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-1.5 rounded-lg font-bold ${activeTab === 'calendar' ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400' : 'text-slate-500'}`}
              >
                Calendário
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-lg font-bold ${activeTab === 'chat' ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400' : 'text-slate-500'}`}
              >
                Chat
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 rounded-lg font-bold ${activeTab === 'reports' ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400' : 'text-slate-500'}`}
              >
                Relatórios
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg font-bold ${activeTab === 'settings' ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400' : 'text-slate-500'}`}
              >
                Gestão
              </button>

            </div>
          </div>

          {/* Core container body context */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-28">
            
            {activeTab === 'dashboard' && (
              <DashboardView 
                currentUser={currentUser}
                projects={projects}
                tasks={tasks}
                onNavigate={(tab) => setActiveTab(tab as any)}
              />
            )}

            {activeTab === 'diario' && (
              <DiarioView 
                currentUser={currentUser}
                projects={projects}
                diaries={diaries}
                users={users}
                tasks={tasks}
                onRefreshDiaries={async () => {
                  const d = await AppApi.getDiaries();
                  setDiaries(d);
                }}
                onRefreshProjects={async () => {
                  const p = await AppApi.getProjects();
                  setProjects(p);
                }}
                onRefreshTasks={async () => {
                  const t = await AppApi.getTasks();
                  setTasks(t);
                }}
              />
            )}

            {activeTab === 'kanban' && (
              <KanbanView 
                currentUser={currentUser}
                users={users}
                projects={projects}
                tasks={tasks}
                onRefreshTasks={async () => {
                  const t = await AppApi.getTasks();
                  setTasks(t);
                }}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarView 
                currentUser={currentUser}
                projects={projects}
                users={users}
                tasks={tasks}
                onRefreshEvents={async () => {
                  const e = await AppApi.getEvents();
                  setEvents(e);
                }}
                events={events}
              />
            )}

            {activeTab === 'chat' && (
              <ChatView 
                currentUser={currentUser}
                users={users}
                chats={chats}
                onRefreshChats={async () => {
                  const c = await AppApi.getChats();
                  setChats(c);
                }}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView 
                projects={projects}
                diaries={diaries}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView 
                currentUser={currentUser}
                users={users}
                onRefreshUsers={async () => {
                  const u = await AppApi.getUsers();
                  setUsers(u);
                }}
                onRefreshLogs={async () => {
                  const l = await AppApi.getLogs();
                  setLogs(l);
                }}
                logs={logs}
              />
            )}

          </main>

          {/* Lower global productivity Cronômetro toolbar (Floating stopwatch widget) */}
          <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-205 dark:border-slate-800 py-3.5 px-4 shadow-xl">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg animate-pulse">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-150 leading-tight">
                    Cronômetro Ativo Britânia
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Grave a minutagem correta e inclua os logs diretamente no diário de bordo.
                  </p>
                </div>
              </div>

              {/* Task bindings & controllers */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                
                {/* select linked demand task */}
                <select
                  value={stopwatchTaskId}
                  onChange={(e) => setStopwatchTaskId(e.target.value)}
                  disabled={stopwatchActive}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-1.5 outline-none max-w-xs text-slate-750 dark:text-white select-none shrink cursor-pointer"
                  title="Vincular Cronometragem a Demanda"
                >
                  <option value="">Atividade Operacional Geral</option>
                  {tasks.filter(t => t.status !== 'Concluído').map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>

                {/* Display clock timer */}
                <div className="font-mono text-sm md:text-md font-bold px-3 py-1 bg-slate-105 dark:bg-slate-950 text-slate-900 dark:text-indigo-400 rounded border border-slate-200 dark:border-slate-800">
                  {formatStopwatchTime(stopwatchSeconds)}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!stopwatchActive ? (
                    <button
                      onClick={startStopwatch}
                      className="p-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 hover:scale-[1.02] cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" />
                      Iniciar
                    </button>
                  ) : (
                    <button
                      onClick={pauseStopwatch}
                      className="p-1 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold flex items-center gap-1 hover:scale-[1.02] cursor-pointer"
                    >
                      <Pause className="h-3.5 w-3.5 fill-white" />
                      Pausar
                    </button>
                  )}

                  <button
                    onClick={resetStopwatch}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-pointer"
                    title="Reiniciar Cronômetro"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={handleStopAndSaveToDiary}
                    className="p-1 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black flex items-center gap-1 active:scale-95 cursor-pointer"
                    title="Interromper e gravar"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Salvar no Diário
                  </button>
                </div>

              </div>

            </div>
          </footer>
        </>
      )}

    </div>
  );
}
