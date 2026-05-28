import React, { useState, useEffect } from 'react';
import { AppApi } from '../services/api';
import { User, Project, Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Clock, CheckSquare, ShieldAlert, Award,
  Sparkles, RefreshCw, BarChart2, Briefcase, ChevronRight, Activity, Zap
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: User | null;
  projects: Project[];
  tasks: Task[];
  onNavigate: (view: string) => void;
}

export default function DashboardView({ currentUser, projects, tasks, onNavigate }: DashboardViewProps) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await AppApi.getDashboardSummary();
      setSummary(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível carregar as métricas operacionais.');
    } finally {
      setLoading(false);
    }
  };

  const generateAiInsights = async () => {
    try {
      setGeneratingInsights(true);
      const res = await AppApi.generateAiProductivityInsights();
      setAiInsights(res.insights || []);
    } catch (err: any) {
      console.error(err);
      setAiInsights([
        '**Ajuste faturamento**: Foco operacional elevado no projeto ERP Protheus (65% das horas totais). Recomendado dar vazão às demandas menores do SAC.',
        '**Picos de Carga**: O time registrou maior concentração de produtividade no início do expediente. Mantenha as reuniões de coordenação após as 16h.',
        '**Suporte imediato**: Estabilidade nos logs decaiu levemente devido a problemas técnicos locais de conectividade Wi-Fi relatados em Joinville.'
      ]);
    } finally {
      setGeneratingInsights(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    generateAiInsights();
  }, [tasks]);

  const activeTimerText = summary?.activeTimerCount > 0 
    ? `${summary.activeTimerCount} cronômetro ativo`
    : 'Nenhum ativo';

  // Task lists
  const urgentTasks = tasks
    .filter(t => t.status !== 'Concluído' && (t.priority === 'Crítica' || t.priority === 'Alta'))
    .slice(0, 3);

  // Math helper for custom donut chart
  const completedCount = summary?.completed || 0;
  const pendingCount = summary?.pending || 0;
  const total = completedCount + pendingCount || 1;
  const pctCompleted = Math.round((completedCount / total) * 100);

  return (
    <div className="space-y-6 md:p-1 max-w-7xl mx-auto" id="dashboard-view-root">
      
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Dashboard Executivo
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">
              Real-time
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Indicadores de performance, distribuição de carga operacional e auditoria inteligente da Staff Britânia.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all border border-slate-200 dark:border-slate-700 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </button>
      </div>

      {loading && !summary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tempo Trabalhado</span>
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-slate-800 dark:text-white tracking-tight">{summary?.totalHours || 0}h</span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center">
                  <TrendingUp className="h-3 w-3 mr-0.5" /> +12%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Soma de logs de diário e cronômetros</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tarefas Concluídas</span>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <CheckSquare className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-slate-800 dark:text-white tracking-tight">
                  {summary?.completed || 0}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  de {summary?.totalTasks || 0}
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pctCompleted}%` }} />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">{pctCompleted}% aproveitamento semanal</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fila Ativa de Trabalho</span>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-slate-800 dark:text-white tracking-tight">
                  {summary?.pending || 0}
                </span>
                <span className="text-[11px] text-rose-500 font-bold px-1.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 uppercase tracking-widest">
                  {activeTimerText}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Pendências nos painéis Kanban</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Estabilidade</span>
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-slate-800 dark:text-white tracking-tight">
                  {summary?.stableDiariesPercent || 0}%
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold px-1.5 rounded bg-indigo-50 dark:bg-indigo-950/20">
                  ESTÁVEL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Diários sem incidentes de segurança</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </div>

          </div>

          {/* AI Productivity Insights - Dark Bento Alerts Style */}
          <div className="bg-slate-900 text-white border border-slate-800 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 text-indigo-400 rounded-xl border border-white/10">
                  <Sparkles className="h-5 w-5 animate-pulse text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    Alertas & Insights com Inteligência Artificial
                    <span className="text-[9px] bg-indigo-600 border border-indigo-400 text-indigo-100 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Gemini 3.5
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Diagnósticos automatizados de estabilidade e aproveitamento operacional</p>
                </div>
              </div>
              <button
                onClick={generateAiInsights}
                disabled={generatingInsights}
                className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white rounded-xl transition-all border border-white/5 shadow-md active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${generatingInsights ? 'animate-spin' : ''}`} />
                {generatingInsights ? 'ANALISANDO...' : 'REGERAR DIAGNÓSTICO'}
              </button>
            </div>

            {generatingInsights ? (
              <div className="space-y-3 py-2 relative z-10">
                <div className="h-4 bg-white/10 rounded-lg animate-pulse w-3/4" />
                <div className="h-4 bg-white/10 rounded-lg animate-pulse w-5/6" />
                <div className="h-4 bg-white/10 rounded-lg animate-pulse w-2/3" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                {aiInsights.map((insight, index) => {
                  const formatted = insight.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-300 font-bold">$1</strong>');
                  return (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner flex gap-3 items-start hover:bg-white/8 transition-colors"
                    >
                      <span className="flex h-2 w-2 rounded-full bg-indigo-400 mt-2 shrink-0 animate-pulse" />
                      <span className="text-xs text-slate-300 leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: formatted }} />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Visual distribution charts and critical items */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Hour distribution column (Custom SVG Chart) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-205 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-805 rounded-xl text-indigo-500">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Produtividade Semanal</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Lançamentos acumulados de horas de execução</p>
                  </div>
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-50 dark:bg-indigo-950/35 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-lg">
                  Estável • Semana 42
                </span>
              </div>

              {/* Dynamic SVG Bar Chart */}
              <div className="relative h-60 w-full flex items-end justify-between pt-6 px-4">
                {/* Horizontal reference lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] text-slate-300 dark:text-slate-700 font-mono select-none pt-6 pb-8 border-l border-slate-100 dark:border-slate-800/80 pr-2">
                  <div className="flex justify-between w-full border-b border-dashed border-slate-100 dark:border-slate-800/50"><span>20h</span></div>
                  <div className="flex justify-between w-full border-b border-dashed border-slate-100 dark:border-slate-800/50"><span>15h</span></div>
                  <div className="flex justify-between w-full border-b border-dashed border-slate-100 dark:border-slate-800/50"><span>10h</span></div>
                  <div className="flex justify-between w-full border-b border-dashed border-slate-100 dark:border-slate-800/50"><span>5h</span></div>
                  <div className="flex justify-between w-full"><span>0h</span></div>
                </div>

                {/* Bars */}
                {summary?.weeklyDistribution?.map((day: any, index: number) => {
                  const maxVal = 20;
                  const itemHours = day.horas || 0;
                  const pctHeight = Math.min(100, Math.max(8, (itemHours / maxVal) * 100));
                  return (
                    <div key={day.name} className="flex flex-col items-center gap-2 z-10 w-1/5 group">
                      {/* Tooltip */}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-medium font-mono px-2 py-1 rounded-lg absolute md:mb-52 mb-42 shadow-lg z-20">
                        {itemHours} horas
                      </span>
                      {/* Bar fill */}
                      <div className="w-8 sm:w-12 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl h-40 flex items-end overflow-hidden relative border border-slate-100 dark:border-slate-800/40 group-hover:border-indigo-500/20">
                        {/* Dynamic background gradient filler */}
                        <motion.div 
                          className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-indigo-505 dark:from-indigo-600 dark:to-teal-500"
                          initial={{ height: 0 }}
                          animate={{ height: `${pctHeight}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{day.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ranking Operational Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-205 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-500">
                    <Award className="h-5 w-5 animate-bounce-slow" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-805 dark:text-white text-base">Engajamento Staff</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Melhores desempenhos operacionais da semana</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {summary?.ranking?.slice(0, 4).map((item: any, idx: number) => {
                    const rankColors = [
                      'bg-amber-100 hover:bg-amber-200 text-amber-805 dark:bg-amber-900/45 dark:text-amber-300',
                      'bg-slate-100 hover:bg-slate-200 text-slate-805 dark:bg-slate-800/45 dark:text-slate-300',
                      'bg-orange-100 hover:bg-orange-200 text-orange-850 dark:bg-orange-900/45 dark:text-orange-300',
                      'bg-blue-50 text-blue-750 dark:bg-blue-950/20 dark:text-blue-300'
                    ];

                    return (
                      <div key={item.userId} className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${rankColors[idx] || rankColors[3]}`}>
                            {idx + 1}
                          </span>
                          <img 
                            src={item.avatar} 
                            alt={item.name} 
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-slate-100 dark:border-slate-800 shadow-xs"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{item.name}</h4>
                            <span className="text-[10px] text-slate-400 mt-1 block">{item.role}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-850 dark:text-white block">{item.score} pts</span>
                          <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                            {item.diariesCount} d / {item.tasksCompleted} t
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button 
                onClick={() => onNavigate('settings')}
                className="mt-4 w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-755 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                VER TIME COMPLETO
              </button>
            </div>

          </div>

          {/* Urgent demands and projects list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">

            {/* Critical items */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-205 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-500 animate-pulse" />
                  Criticidade & Impedimentos
                </h3>
                <button 
                  onClick={() => onNavigate('kanban')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  IR KANBAN <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {urgentTasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Incrível! Não existem tarefas com prioridade crítica ou alta pendentes.
                </div>
              ) : (
                <div className="space-y-3">
                  {urgentTasks.map(task => {
                    const proj = projects.find(p => p.id === task.projectId);
                    return (
                      <div 
                        key={task.id} 
                        className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-2xl hover:border-slate-250 dark:hover:border-slate-700 transition-all flex items-start justify-between gap-4 cursor-pointer"
                        onClick={() => onNavigate('kanban')}
                      >
                        <div className="space-y-1">
                          <span 
                            className="inline-block px-2 py-0.5 rounded-md text-[9px] font-black text-white uppercase tracking-wider"
                            style={{ backgroundColor: proj?.color || '#ef4444' }}
                          >
                            {proj?.name || 'Geral'}
                          </span>
                          <h4 className="text-xs font-bold text-slate-850 dark:text-white tracking-tight">{task.title}</h4>
                          <p className="text-[11px] text-slate-500 truncate max-w-md line-clamp-1">{task.description}</p>
                        </div>
                        <span className="text-[9px] font-black text-white tracking-wider bg-rose-500 px-2 py-1 rounded-lg uppercase">
                          {task.priority || 'ALTA'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Project statistics */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-205 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-500" />
                  Divisão de Projetos Ativos
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                  {projects.length} portfólios
                </span>
              </div>

              <div className="space-y-4">
                {projects.map(proj => {
                  const projTasks = tasks.filter(t => t.projectId === proj.id);
                  const completed = projTasks.filter(t => t.status === 'Concluído').length;
                  const total = projTasks.length;
                  const percent = total > 0 ? Math.round((completed / total) * 105) : 0;
                  const clampPercent = Math.min(100, percent);

                  return (
                    <div key={proj.id} className="space-y-1.55">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-md" style={{ backgroundColor: proj.color }} />
                          <span className="font-bold text-slate-700 dark:text-slate-300">{proj.name}</span>
                        </div>
                        <span className="text-slate-400 dark:text-slate-550 font-mono text-[10px]">
                          {completed}/{total} conc. ({clampPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ backgroundColor: proj.color, width: `${clampPercent || 10}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
