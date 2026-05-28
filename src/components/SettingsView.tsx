import React, { useState, useEffect } from 'react';
import { AppApi } from '../services/api';
import { User, AuditLog, Role, Team, Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, ShieldAlert, FileText, Plus, UserPlus, Shield, 
  Settings, Clock, ArrowRight, Eye, CheckSquare, Trash, Lock, 
  UserCheck, ChevronDown, ChevronRight, Edit2, Check, X, 
  ToggleLeft, ToggleRight, Network, Briefcase, Award, Search, 
  Database, AlertCircle, Sparkles, BookOpen, Layers
} from 'lucide-react';

interface SettingsViewProps {
  currentUser: User | null;
  users: User[];
  onRefreshUsers: () => Promise<void>;
  onRefreshLogs: () => Promise<void>;
  logs: AuditLog[];
}

export default function SettingsView({ currentUser, users, onRefreshUsers, onRefreshLogs, logs }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'organograma' | 'users' | 'permissions' | 'logs'>('organograma');
  
  // Custom states for organizational chart
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [selectedUserNode, setSelectedUserNode] = useState<string | null>('u-1'); // Default selected analyst

  // User Management Registration Form state
  const [isRegistering, setIsRegistering] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('Analista');
  const [newUserAvatar, setNewUserAvatar] = useState('');
  const [newUserReportsTo, setNewUserReportsTo] = useState<string>('');
  const [newPermissions, setNewPermissions] = useState({
    canEditSettings: false,
    canCreateProjects: false,
    canRegisterMeetings: true,
    canManageUsers: false
  });

  // User Editing Form state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<Role>('Analista');
  const [editUserAvatar, setEditUserAvatar] = useState('');
  const [editUserReportsTo, setEditUserReportsTo] = useState<string>('');
  const [editUserActive, setEditUserActive] = useState<boolean>(true);
  const [editPermissions, setEditPermissions] = useState({
    canEditSettings: false,
    canCreateProjects: false,
    canRegisterMeetings: false,
    canManageUsers: false
  });

  // Squads/Teams Edit & Creation form states
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamSector, setTeamSector] = useState('TI Desenvolvimentos');
  const [teamLeaderId, setTeamLeaderId] = useState('');
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  const [teamTagsStr, setTeamTagsStr] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Search/Filter states
  const [userSearchText, setUserSearchText] = useState('');

  // Fetch complete organizational structure details
  const loadOrgData = async () => {
    try {
      setLoadingOrg(true);
      const [tList, parsedTasks] = await Promise.all([
        AppApi.getTeams(),
        AppApi.getTasks()
      ]);
      setTeams(tList);
      setTasks(parsedTasks);
    } catch (err) {
      console.error('Erro ao buscar dados organizacionais estruturados:', err);
    } finally {
      setLoadingOrg(false);
    }
  };

  useEffect(() => {
    loadOrgData();
  }, []);

  // Show a temporal success notification
  const showNotice = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  // Create User Handler
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    try {
      setLoading(true);
      const generatedAvatar = newUserAvatar || `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 1000)}?w=150`;
      
      const createdUser = await AppApi.createUser({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        avatar: generatedAvatar,
        active: true,
        reportsToUserId: newUserReportsTo || undefined,
        permissions: newPermissions
      });

      // Clear register values
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('Analista');
      setNewUserAvatar('');
      setNewUserReportsTo('');
      setNewPermissions({
        canEditSettings: false,
        canCreateProjects: false,
        canRegisterMeetings: true,
        canManageUsers: false
      });
      setIsRegistering(false);

      showNotice(`Colaborador "${createdUser.name}" cadastrado com sucesso.`);
      await onRefreshUsers();
      await onRefreshLogs();
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar novo colaborador.');
    } finally {
      setLoading(false);
    }
  };

  // Select User to edit, fill standard values
  const handleInitiateEdit = (u: User) => {
    setEditingUser(u);
    setEditUserName(u.name);
    setEditUserEmail(u.email);
    setEditUserRole(u.role);
    setEditUserAvatar(u.avatar);
    setEditUserReportsTo(u.reportsToUserId || '');
    setEditUserActive(u.active !== false); // default to true
    setEditPermissions({
      canEditSettings: u.permissions?.canEditSettings || false,
      canCreateProjects: u.permissions?.canCreateProjects || false,
      canRegisterMeetings: u.permissions?.canRegisterMeetings || false,
      canManageUsers: u.permissions?.canManageUsers || false
    });
  };

  // Save User Edits
  const handleSaveUserEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setLoading(true);
      const payload: Partial<User> = {
        name: editUserName,
        email: editUserEmail,
        role: editUserRole,
        avatar: editUserAvatar,
        active: editUserActive,
        reportsToUserId: editUserReportsTo || undefined,
        permissions: editPermissions
      };

      const result = await AppApi.updateUser(editingUser.id, payload);
      
      setEditingUser(null);
      showNotice(`Dados administrativos de "${result.name}" atualizados!`);
      
      await onRefreshUsers();
      await onRefreshLogs();
    } catch (err) {
      console.error(err);
      alert('Houve um erro ao atualizar os dados administrativos do usuário.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle user state (Quick active/deactivate toggle)
  const handleToggleUserActive = async (targetUser: User) => {
    try {
      setLoading(true);
      const nextActiveState = targetUser.active === false ? true : false;
      const updated = await AppApi.updateUser(targetUser.id, {
        active: nextActiveState
      });
      showNotice(`Usuário "${updated.name}" foi ${nextActiveState ? 'ativado' : 'desativado'} com sucesso!`);
      await onRefreshUsers();
      await onRefreshLogs();
    } catch (err) {
      console.error(err);
      alert('Falta de privilégios ou erro de rede para desativar usuário.');
    } finally {
      setLoading(false);
    }
  };

  // Squad / Team Handlers
  const handleInitiateCreateTeam = () => {
    setEditingTeam(null);
    setTeamName('');
    setTeamDescription('');
    setTeamSector('TI Desenvolvimentos');
    const firstLeader = users.find(u => u.role === 'Supervisor' || u.role === 'Gestão')?.id || '';
    setTeamLeaderId(firstLeader);
    setTeamMemberIds([]);
    setTeamTagsStr('');
    setIsCreatingTeam(true);
  };

  const handleInitiateEditTeam = (t: Team) => {
    setEditingTeam(t);
    setTeamName(t.name);
    setTeamDescription(t.description);
    setTeamSector(t.sector);
    setTeamLeaderId(t.leaderId);
    setTeamMemberIds(t.memberIds || []);
    setTeamTagsStr(t.tags ? t.tags.join(', ') : '');
    setIsCreatingTeam(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamLeaderId) {
      alert('Preencha o nome do time e escolha o líder responsável.');
      return;
    }

    try {
      setLoading(true);
      const tagsArray = teamTagsStr
        ? teamTagsStr.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      const payload = {
        name: teamName,
        description: teamDescription,
        sector: teamSector,
        leaderId: teamLeaderId,
        memberIds: teamMemberIds,
        tags: tagsArray
      };

      if (editingTeam) {
        // Edit squad
        await AppApi.updateTeam(editingTeam.id, payload);
        showNotice(`Time operacional "${teamName}" atualizado com sucesso.`);
      } else {
        // Create new squad
        await AppApi.createTeam(payload);
        showNotice(`Nova esquadra "${teamName}" sistematizada com sucesso.`);
      }

      setIsCreatingTeam(false);
      setEditingTeam(null);
      await loadOrgData();
      await onRefreshLogs();
    } catch (err) {
      console.error(err);
      alert('Houve um erro técnico ao registrar o time especializado.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMember = (userId: string) => {
    if (teamMemberIds.includes(userId)) {
      setTeamMemberIds(teamMemberIds.filter(id => id !== userId));
    } else {
      setTeamMemberIds([...teamMemberIds, userId]);
    }
  };

  // Matrix roles capabilities mapping
  const rolePermissions = [
    { cap: 'Registrar diário de bordo cotidiano', analista: true, supervisor: true, gestao: true },
    { cap: 'Utilizar cronômetro integrados nas demandas', analista: true, supervisor: true, gestao: true },
    { cap: 'Movimentar status de cards no Kanban', analista: true, supervisor: true, gestao: true },
    { cap: 'Participar de canais do Chat Corporativo', analista: true, supervisor: true, gestao: true },
    { cap: 'Criar novas demandas e cards para o time', analista: false, supervisor: true, gestao: true },
    { cap: 'Extrair relatórios consolidados estendidos', analista: false, supervisor: true, gestao: true },
    { cap: 'Ver logs de auditoria e trilha técnica', analista: false, supervisor: true, gestao: true },
    { cap: 'Gerenciar projetos e cadastrar colaboradores', analista: false, supervisor: false, gestao: true }
  ];

  // Filters for User Management Tab list
  const filteredUsers = users.filter(u => {
    if (!userSearchText) return true;
    const query = userSearchText.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query)
    );
  });

  // Organograma building helpers:
  // We want to visually display subordination lines. Let's find directors (no supervisor or boss reportsToUserId represents a director or Gestao)
  const topLevels = users.filter(u => u.active !== false && (u.role === 'Gestão' || !u.reportsToUserId));
  
  // Find child users reports directly to a parent
  const getSubordinatesOf = (parentId: string) => {
    return users.filter(u => u.active !== false && u.reportsToUserId === parentId);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="settings-view-root">
      
      {/* Upper Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-900/40 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/25 border border-indigo-400/30 text-indigo-200">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            Painel Administrativo Britânia
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Gestão & Estrutura Organizacional
          </h1>
          <p className="text-indigo-200/80 text-xs">
            Controle de perfis do time, organograma hierárquico, squads operacionais, matriz de acessos compartilhados e auditoria.
          </p>
        </div>
        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <button
            onClick={() => loadOrgData()}
            className="p-2 bg-indigo-900/60 hover:bg-indigo-800 text-white rounded-lg border border-indigo-700/50 flex items-center justify-center gap-1 cursor-pointer transition-all"
            title="Recarregar Estrutura"
          >
            <Clock className="h-4.5 w-4.5" />
            <span className="text-xs font-bold px-1">Sincronizar</span>
          </button>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      </div>

      {/* Temporal success notification toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-850 text-emerald-800 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm"
          >
            <div className="p-1.5 bg-emerald-600 text-white rounded-full">
              <Check className="h-3.5 w-3.5" />
            </div>
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto whitespace-nowrap scrollbar-none select-none">
        
        <button
          onClick={() => setActiveTab('organograma')}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'organograma' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/10' 
              : 'border-transparent text-slate-500 hover:text-slate-705'
          }`}
        >
          <Network className="h-4 w-4" />
          Estrutura Organizacional (Organograma)
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'users' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/10' 
              : 'border-transparent text-slate-500 hover:text-slate-705'
          }`}
        >
          <Users className="h-4 w-4" />
          Gestão de Usuários ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'permissions' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/10' 
              : 'border-transparent text-slate-500 hover:text-slate-705'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Políticas e Permissões
        </button>

        <button
          onClick={() => {
            setActiveTab('logs');
            onRefreshLogs();
          }}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'logs' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/10' 
              : 'border-transparent text-slate-500 hover:text-slate-705'
          }`}
        >
          <FileText className="h-4 w-4" />
          Registro de Auditoria (Logs)
        </button>
      </div>

      {/* Master Tab Content Blocks */}
      <div className="space-y-6">

        {/* TAB 1: ESTRUTURA ORGANIZACIONAL (ORGANOGRAMA VISUAL COM SUBORDINAÇÃO) */}
        {activeTab === 'organograma' && (
          <div className="space-y-6">
            
            {/* Top overview row with filters and visual intro */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Explanatory instruction of reporting structure */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-450">
                      <Network className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Organograma Corporativo Interativo</h3>
                      <p className="text-[10px] text-slate-400">Exibindo fluxo hierárquico e demandas ativas por colaborador.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-indigo-500 uppercase bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded">
                    SISTEMA INTELIGENTE
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-350 text-xs leading-relaxed">
                  Esta estrutura organiza visualmente as relações de <strong>subordinação da Britânia</strong>. 
                  Clique em qualquer colaborador para abrir seu <strong>Dossiê de Demandas Individuais</strong> no mini-painel lateral à direita, avaliando seu volume de tarefas vigentes e responsabilidades ativas.
                </p>

                {/* VISUAL HIERARCHY TREE LAYOUT */}
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-8 select-none relative">
                  
                  {/* We recurse topLevels (which are usually Mariana / Directors) */}
                  {topLevels.map((director) => {
                    const supervisorList = getSubordinatesOf(director.id);

                    return (
                      <div key={director.id} className="space-y-6">
                        {/* Director / President Node */}
                        <div className="flex justify-center">
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedUserNode(director.id)}
                            className={`p-3.5 max-w-sm w-full rounded-xl border transition-all cursor-pointer relative ${
                              selectedUserNode === director.id
                                ? 'bg-indigo-600/5 dark:bg-indigo-950/20 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-250 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img 
                                  src={director.avatar} 
                                  alt={director.name} 
                                  referrerPolicy="no-referrer"
                                  className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500"
                                />
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" title="Online" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{director.name}</h4>
                                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase mb-0.5">{director.role}</p>
                                <p className="text-[9px] text-slate-400 truncate">{director.email}</p>
                              </div>
                            </div>
                            
                            {/* Role indicator label in upper right */}
                            <span className="absolute top-2 right-2.5 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              Liderança Máxima
                            </span>
                          </motion.div>
                        </div>

                        {/* Visual Connector bar from top leader to supervisors */}
                        {supervisorList.length > 0 && (
                          <div className="flex flex-col items-center">
                            <div className="w-0.5 h-4 bg-slate-350 dark:bg-slate-700" />
                            <div className="w-1/2 h-0.5 bg-slate-350 dark:bg-slate-700" />
                          </div>
                        )}

                        {/* List of Supervisors in Level 2 */}
                        {supervisorList.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                            {supervisorList.map((supervisor, supIdx) => {
                              const analystList = getSubordinatesOf(supervisor.id);

                              return (
                                <div key={supervisor.id} className="space-y-4 flex flex-col items-center justify-start">
                                  
                                  {/* supervisor cards */}
                                  <motion.div 
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => setSelectedUserNode(supervisor.id)}
                                    className={`p-3.5 w-full max-w-sm rounded-xl border transition-all cursor-pointer relative ${
                                      selectedUserNode === supervisor.id
                                        ? 'bg-indigo-600/5 dark:bg-indigo-950/20 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                                        : 'bg-slate-50 dark:bg-slate-950 border-slate-250 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="relative">
                                        <img 
                                          src={supervisor.avatar} 
                                          alt={supervisor.name} 
                                          referrerPolicy="no-referrer"
                                          className="w-10 h-10 rounded-full object-cover border-2 border-amber-500"
                                        />
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" title="Online" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h4 className="text-xs font-black text-slate-950 dark:text-white truncate">{supervisor.name}</h4>
                                        <p className="text-[9px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-wide">Supervisão Operacional</p>
                                        <p className="text-[9px] text-slate-400 truncate">Responde para: {director.name}</p>
                                      </div>
                                    </div>
                                    <span className="absolute top-2 right-2.5 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 uppercase tracking-widest font-mono">
                                      Gerente / Sup
                                    </span>
                                  </motion.div>

                                  {/* Connector from supervisor card to analyst lists */}
                                  {analystList.length > 0 && (
                                    <div className="flex flex-col items-center w-full">
                                      <div className="w-0.5 h-4 bg-slate-350 dark:bg-slate-700" />
                                      <div className="w-4/5 h-0.5 bg-slate-250 dark:bg-slate-800" />
                                    </div>
                                  )}

                                  {/* Level 3: Reporting Analysts list aligned vertically/flex */}
                                  {analystList.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                      {analystList.map((analyst) => {
                                        const analystTasks = tasks.filter(t => t.assignees?.includes(analyst.id) && t.status !== 'Concluído');

                                        return (
                                          <div key={analyst.id} className="flex flex-col items-center">
                                            <div className="w-0.5 h-2 bg-slate-250 dark:bg-slate-800" />
                                            <motion.div
                                              whileHover={{ scale: 1.02 }}
                                              onClick={() => setSelectedUserNode(analyst.id)}
                                              className={`p-2.5 w-full rounded-xl border transition-all text-left cursor-pointer relative ${
                                                selectedUserNode === analyst.id
                                                  ? 'bg-indigo-600/5 dark:bg-indigo-950/20 border-indigo-500 shadow-sm'
                                                  : 'bg-slate-50/70 dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                <img 
                                                  src={analyst.avatar} 
                                                  alt={analyst.name} 
                                                  referrerPolicy="no-referrer"
                                                  className="w-8 h-8 rounded-full object-cover border border-sky-400"
                                                />
                                                <div className="min-w-0 flex-1">
                                                  <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">{analyst.name}</h5>
                                                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{analyst.role}</p>
                                                </div>
                                              </div>

                                              {/* Indicators / Tasks pending count */}
                                              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[9px]">
                                                <span className="text-slate-400 font-semibold">Responde para Carlos</span>
                                                <span className={`px-1 rounded font-bold ${
                                                  analystTasks.length > 0 
                                                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400' 
                                                    : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-750'
                                                }`}>
                                                  {analystTasks.length} {analystTasks.length === 1 ? 'demanda' : 'demandas'}
                                                </span>
                                              </div>
                                            </motion.div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                </div>
                              );
                            })}
                          </div>
                        )}

                      </div>
                    );
                  })}

                </div>

              </div>

              {/* RIGHT SIDEBAR: DOSSIÊ INDIVIDUALE DE DEMANDAS / DETALHES DE CARGA */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                
                {(() => {
                  const targetUser = users.find(u => u.id === selectedUserNode);
                  if (!targetUser) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <p className="text-xs">Selecione um colaborador no organograma para avaliar as demandas ativas.</p>
                      </div>
                    );
                  }

                  const openTasks = tasks.filter(t => t.assignees?.includes(targetUser.id));
                  const pendingTasks = openTasks.filter(t => t.status !== 'Concluído');
                  const completedTasks = openTasks.filter(t => t.status === 'Concluído');

                  // Find squads this user belongs to
                  const memberSquads = teams.filter(t => t.leaderId === targetUser.id || t.memberIds?.includes(targetUser.id));

                  return (
                    <div className="space-y-4">
                      
                      {/* Folder Title header */}
                      <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-200 dark:border-slate-800">
                        <Award className="h-5 w-5 text-indigo-500" />
                        <div>
                          <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest">Dossiê de Trabalho</h4>
                          <span className="text-[10px] text-slate-400">Atribuições vigentes & Times</span>
                        </div>
                      </div>

                      {/* Bio Summary card */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-3 border border-slate-150 dark:border-slate-850">
                        
                        <div className="flex items-center gap-3">
                          <img 
                            src={targetUser.avatar} 
                            alt={targetUser.name} 
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/30"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{targetUser.name}</h4>
                            <p className="text-[9px] text-indigo-650 dark:text-indigo-400 font-bold uppercase tracking-widest">{targetUser.role}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{targetUser.email}</p>
                          </div>
                        </div>

                        {/* Hierarchical line description */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] space-y-1 text-slate-600 dark:text-slate-300 font-medium">
                          
                          <div className="flex justify-between">
                            <span className="text-slate-400">Subordinação imediata:</span>
                            <span className="font-bold">
                              {targetUser.reportsToUserId ? (
                                users.find(u => u.id === targetUser.reportsToUserId)?.name || 'Consultor Técnico'
                              ) : (
                                'Diretor Geral / Gestão Britânia'
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-400 font-semibold">Registo operacional:</span>
                            <span className="px-1.5 py-0.5 rounded text-[8px] uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
                              {targetUser.active !== false ? 'Cadastro Ativo' : 'Cadastro Suspenso'}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-400 font-semibold">Status de Presença:</span>
                            <span className={`font-bold ${
                              targetUser.status === 'Online' ? 'text-emerald-500' :
                              targetUser.status === 'Ocupado' ? 'text-rose-500' : 'text-amber-500'
                            }`}>
                              ● {targetUser.status}
                            </span>
                          </div>

                        </div>
                      </div>

                      {/* Squad memberships list */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase select-none">Squads Integradas</label>
                        <div className="space-y-1 md:max-h-24 overflow-y-auto">
                          {memberSquads.map(s => (
                            <div key={s.id} className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs flex justify-between items-center border border-slate-100 dark:border-slate-850">
                              <span className="font-bold text-slate-700 dark:text-slate-350">{s.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-wide bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
                                {s.leaderId === targetUser.id ? 'Líder / Supervisor' : 'Membro'}
                              </span>
                            </div>
                          ))}
                          {memberSquads.length === 0 && (
                            <p className="text-[10px] text-slate-400 italic">Nenhum vínculo a squad técnica vigendo.</p>
                          )}
                        </div>
                      </div>

                      {/* Demand details - Quais demandas cada pessoa possui */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center select-none">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase">Carga de Demandas Ativas ({pendingTasks.length})</label>
                          <span className="text-[8px] bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded text-slate-400 font-mono">Total {openTasks.length}</span>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          
                          {pendingTasks.map((t) => (
                            <div key={t.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-l-4 border-l-indigo-500 border-slate-200 dark:border-slate-900 rounded-lg space-y-1.5">
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-205 leading-tight hover:underline cursor-pointer">{t.title}</span>
                                <span className={`shrink-0 text-[8px] font-black px-1 rounded ${
                                  t.priority === 'Crítica' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450' :
                                  t.priority === 'Alta' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/25 dark:text-amber-400' :
                                  'bg-blue-50 text-blue-700 dark:bg-blue-950/25 dark:text-blue-400'
                                }`}>
                                  {t.priority}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold select-none">
                                <span>Status: <b className="text-slate-600 dark:text-slate-350">{t.status}</b></span>
                                <span>{t.dueDate ? `Prazo: ${t.dueDate}` : 'Sem prazo'}</span>
                              </div>
                            </div>
                          ))}

                          {pendingTasks.length === 0 && (
                            <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                              <p className="text-[11px] text-slate-400 font-semibold">Parabéns! Nenhuma demanda pendente no Kanban.</p>
                              <p className="text-[9px] text-emerald-500 font-bold">● Carga de Trabalho Zero (Fila Zerada)</p>
                            </div>
                          )}

                          {/* Completed tasks list summary */}
                          {completedTasks.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                              <span className="text-[9px] text-slate-400 font-mono block select-none">Histórico recente de resoluções:</span>
                              <div className="mt-1 space-y-1">
                                {completedTasks.slice(0, 3).map((ct) => (
                                  <div key={ct.id} className="text-[10px] flex items-center justify-between p-1 bg-emerald-500/5 dark:bg-emerald-950/10 rounded border border-emerald-55 border-dashed border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-medium">
                                    <span className="truncate pr-2 line-through">{ct.title}</span>
                                    <span className="text-[8px] shrink-0 font-bold uppercase">Resolvida</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>

                    </div>
                  );
                })()}

              </div>

            </div>

            {/* LOWER PORTION: TIMES OPERACIONAIS (SQUADS) MANAGEMENT SECTION */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-150 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-55 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-indigo-600">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Squads de Atuação e Times Operacionais</h3>
                    <p className="text-[10px] text-slate-400">Atribuições de divisão técnica, competências e membros integrados.</p>
                  </div>
                </div>

                <button
                  onClick={handleInitiateCreateTeam}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Sistematizar Nova Squad
                </button>
              </div>

              {/* SQUAD / TEAM CREATION & EDIT COMPONENT OVERLAY */}
              <AnimatePresence>
                {isCreatingTeam && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 p-5 space-y-4 shadow-inner"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-850">
                      <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                        <Database className="h-4 w-4 text-indigo-500" />
                        {editingTeam ? `Configurar Componente: ${editingTeam.name}` : 'Cadastrar Nova Squad Técnica'}
                      </h4>
                      <button
                        onClick={() => {
                          setIsCreatingTeam(false);
                          setEditingTeam(null);
                        }}
                        className="text-slate-450 hover:text-slate-700"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveTeam} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-450 uppercase">Nome da Squad / Time</label>
                        <input
                          type="text"
                          required
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="Ex: Sustentação ERP ou Desenvolvimento Mobile"
                          className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 outline-none dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-450 uppercase">Silo Organizador (Sector)</label>
                        <input
                          type="text"
                          required
                          value={teamSector}
                          onChange={(e) => setTeamSector(e.target.value)}
                          placeholder="Ex: TI Sistemas Core / Logística"
                          className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 outline-none dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-450 uppercase">Supervisor Responsável (Leader)</label>
                        <select
                          value={teamLeaderId}
                          required
                          onChange={(e) => setTeamLeaderId(e.target.value)}
                          className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 outline-none dark:text-white cursor-pointer font-semibold"
                        >
                          <option value="">Selecione um líder responsável</option>
                          {users.filter(u => u.active !== false).map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-slate-450 uppercase">Competências e Tecnologias (Tags separadas por vírgula)</label>
                        <input
                          type="text"
                          value={teamTagsStr}
                          onChange={(e) => setTeamTagsStr(e.target.value)}
                          placeholder="ERP, SQL Server, AdvPL, Faturamento, WMS"
                          className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 outline-none dark:text-white"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-3">
                        <label className="text-[10px] font-black text-slate-450 uppercase">Descrição da Missão da Squad</label>
                        <input
                          type="text"
                          value={teamDescription}
                          onChange={(e) => setTeamDescription(e.target.value)}
                          placeholder="Defina o objetivo principal técnico e responsabilidades do time na corporação."
                          className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 outline-none dark:text-white"
                        />
                      </div>

                      {/* Multi-select Members */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-black text-slate-450 uppercase block select-none mb-1">Integrantes / Analistas Alocados</label>
                        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 rounded-lg max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {users.filter(u => u.active !== false).map((u) => {
                            const isMember = teamMemberIds.includes(u.id);
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => handleToggleMember(u.id)}
                                className={`text-left p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                                  isMember
                                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 font-bold'
                                    : 'bg-slate-50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-850 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                                <span className="truncate">{u.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="md:col-span-3 flex justify-end gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingTeam(false);
                            setEditingTeam(null);
                          }}
                          className="text-xs font-bold px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-600 dark:text-slate-350 rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="text-xs font-bold px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                        >
                          {editingTeam ? 'Salvar Configuração' : 'Registrar Squad'}
                        </button>
                      </div>

                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid lists of squads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {teams.map((squad) => {
                  const leader = users.find(u => u.id === squad.leaderId);
                  const sMembers = users.filter(u => squad.memberIds?.includes(u.id));

                  return (
                    <div 
                      key={squad.id} 
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 relative flex flex-col justify-between hover:shadow-md transition-all space-y-4"
                    >
                      <div className="space-y-2">
                        
                        {/* Area silo & actions */}
                        <div className="flex items-start justify-between">
                          <span className="text-[9px] font-black uppercase text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                            {squad.sector}
                          </span>
                          
                          <button
                            onClick={() => handleInitiateEditTeam(squad)}
                            className="p-1 px-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-600 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                          >
                            <Edit2 className="h-3 w-3" />
                            Editar
                          </button>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">{squad.name}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2 mt-1 min-h-[33px]">{squad.description}</p>
                        </div>

                        {/* Tech skills tag-cloud */}
                        <div className="flex flex-wrap gap-1">
                          {squad.tags?.map((t, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-indigo-950/20 text-slate-500 dark:text-indigo-300 font-mono text-[8px] font-semibold">
                              #{t}
                            </span>
                          ))}
                        </div>

                      </div>

                      {/* Leader and Staff info */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        
                        {/* Leader card block */}
                        {leader ? (
                          <div className="flex items-center gap-2">
                            <img src={leader.avatar} alt={leader.name} className="w-7 h-7 rounded-full object-cover border border-amber-500" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold tracking-tight uppercase leading-none">Supervisor Squad</p>
                              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{leader.name}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-450 italic">Sem líder nominal</span>
                        )}

                        {/* Avatars group members */}
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {sMembers.map((m) => (
                              <img 
                                key={m.id} 
                                src={m.avatar} 
                                alt={m.name} 
                                title={m.name}
                                referrerPolicy="no-referrer"
                                className="inline-block h-6 w-6 rounded-full object-cover ring-2 ring-white dark:ring-slate-950" 
                              />
                            ))}
                          </div>
                          <span className="text-[9px] font-mono font-bold text-slate-400">
                            +{sMembers.length} integrantes
                          </span>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: GESTÃO DE USUÁRIOS COMPLETA (CRUD COM PERMISSÕES E STATUS) */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            
            {/* Action Bar: Search, Add */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850">
              
              <div className="relative w-full sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou cargo..."
                  value={userSearchText}
                  onChange={(e) => setUserSearchText(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-2 outline-none dark:text-white focus:border-indigo-650"
                />
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400" />
              </div>

              {currentUser?.role === 'Gestão' && (
                <button
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all cursor-pointer w-full sm:w-auto"
                >
                  <UserPlus className="h-4 w-4" />
                  Cadastrar Colaborador
                </button>
              )}

            </div>

            {/* FORMULARIO DE REGISTRO / CRIAÇÃO DE USUÁRIO */}
            <AnimatePresence>
              {isRegistering && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-250 dark:border-slate-800 p-5 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-150 dark:border-slate-850">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <UserCheck className="h-4.5 w-4.5 text-indigo-500" />
                      Novo Membro no Time Britânia
                    </h3>
                    <button onClick={() => setIsRegistering(false)} className="text-slate-450 hover:text-slate-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleRegisterUser} className="space-y-4">
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-450">Nome Completo</label>
                        <input
                          type="text"
                          value={newUserName}
                          required
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="Ex: João da Silva"
                          className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg p-2.5 outline-none dark:text-white focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-450">Email Corporativo</label>
                        <input
                          type="email"
                          value={newUserEmail}
                          required
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="joao.silva@britania.com.br"
                          className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg p-2.5 outline-none dark:text-white focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-450">Nível Operacional (Role)</label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as any)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg p-2.5 outline-none dark:text-white cursor-pointer"
                        >
                          <option value="Analista">Analista</option>
                          <option value="Supervisor">Supervisor</option>
                          <option value="Gestão">Gestão</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-450">Superior Imediato (Reports To)</label>
                        <select
                          value={newUserReportsTo}
                          onChange={(e) => setNewUserReportsTo(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg p-2.5 outline-none dark:text-white cursor-pointer"
                        >
                          <option value="">Nenhum (Diretor / Gestor Máximo)</option>
                          {users.filter(u => u.active !== false).map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                          ))}
                        </select>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-450">Avatar URL (Deixe vazio para gerar randômico)</label>
                        <input
                          type="text"
                          value={newUserAvatar}
                          onChange={(e) => setNewUserAvatar(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg p-2.5 outline-none dark:text-white focus:border-indigo-500"
                        />
                      </div>

                      {/* Direct Custom Permissions Switch */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-450 block">Modos e Privilégios de Acesso (Permissions)</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={newPermissions.canEditSettings}
                              onChange={(e) => setNewPermissions({...newPermissions, canEditSettings: e.target.checked})}
                              className="accent-indigo-600 rounded"
                            />
                            <span>Editar Ajustes</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={newPermissions.canCreateProjects}
                              onChange={(e) => setNewPermissions({...newPermissions, canCreateProjects: e.target.checked})}
                              className="accent-indigo-600 rounded"
                            />
                            <span>Criar Projetos</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={newPermissions.canRegisterMeetings}
                              onChange={(e) => setNewPermissions({...newPermissions, canRegisterMeetings: e.target.checked})}
                              className="accent-indigo-600 rounded"
                            />
                            <span>Atas de Reunião</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={newPermissions.canManageUsers}
                              onChange={(e) => setNewPermissions({...newPermissions, canManageUsers: e.target.checked})}
                              className="accent-indigo-600 rounded"
                            />
                            <span>Gerenciar Usuários</span>
                          </label>
                        </div>
                      </div>

                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsRegistering(false)}
                        className="text-xs font-bold px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-lg cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="text-xs font-bold px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                      >
                        Cadastrar Integrante
                      </button>
                    </div>

                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FORMULÁRIO DE EDIÇÃO DE USUÁRIO (MODAL INTERATIVO) */}
            <AnimatePresence>
              {editingUser && (
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-xl w-full shadow-2xl space-y-4"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-150 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <img src={editUserAvatar} alt="edit-preview" className="w-8 h-8 rounded-full object-cover" />
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">Editar Colaborador Administrativo</h3>
                      </div>
                      <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveUserEdits} className="space-y-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Nome Oficial</label>
                          <input
                            type="text"
                            required
                            value={editUserName}
                            onChange={(e) => setEditUserName(e.target.value)}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-2.5 rounded-lg outline-none dark:text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Email Corporativo</label>
                          <input
                            type="email"
                            required
                            value={editUserEmail}
                            onChange={(e) => setEditUserEmail(e.target.value)}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 p-2.5 rounded-lg outline-none dark:text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Nível Operacional (Role)</label>
                          <select
                            value={editUserRole}
                            onChange={(e) => setEditUserRole(e.target.value as any)}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 p-2.5 rounded-lg outline-none dark:text-white cursor-pointer"
                          >
                            <option value="Analista">Analista</option>
                            <option value="Supervisor">Supervisor</option>
                            <option value="Gestão">Gestão</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Supervisor Responsável</label>
                          <select
                            value={editUserReportsTo}
                            onChange={(e) => setEditUserReportsTo(e.target.value)}
                            className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 p-2.5 rounded-lg outline-none dark:text-white cursor-pointer"
                          >
                            <option value="">Nenhum (Presidente / Gestão da Empresa)</option>
                            {users.filter(u => u.id !== editingUser.id && u.active !== false).map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                          </select>
                        </div>

                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Avatar URL</label>
                        <input
                          type="text"
                          value={editUserAvatar}
                          onChange={(e) => setEditUserAvatar(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 p-2 rounded-lg outline-none dark:text-white"
                        />
                      </div>

                      {/* Permissions matrices toggles */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-3">
                        <span className="text-[10.5px] uppercase font-black tracking-wider text-slate-450 block">Atribuição e Permissões Administrativa Customizadas (Acessos)</span>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPermissions.canEditSettings}
                              onChange={(e) => setEditPermissions({...editPermissions, canEditSettings: e.target.checked})}
                              className="accent-indigo-600 h-3.5 w-3.5 rounded"
                            />
                            <div>
                              <p className="font-bold">Ajustes do Sistema</p>
                              <p className="text-[8px] text-slate-400">Configurações globais e logs</p>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPermissions.canCreateProjects}
                              onChange={(e) => setEditPermissions({...editPermissions, canCreateProjects: e.target.checked})}
                              className="accent-indigo-600 h-3.5 w-3.5 rounded"
                            />
                            <div>
                              <p className="font-bold">Ciclo de Projetos</p>
                              <p className="text-[8px] text-slate-400">Permitir criar novos projetos</p>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPermissions.canRegisterMeetings}
                              onChange={(e) => setEditPermissions({...editPermissions, canRegisterMeetings: e.target.checked})}
                              className="accent-indigo-600 h-3.5 w-3.5 rounded"
                            />
                            <div>
                              <p className="font-bold">Atas de Reuniões</p>
                              <p className="text-[8px] text-slate-400">Acesso a registrar novas atas</p>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editPermissions.canManageUsers}
                              onChange={(e) => setEditPermissions({...editPermissions, canManageUsers: e.target.checked})}
                              className="accent-indigo-600 h-3.5 w-3.5 rounded"
                            />
                            <div>
                              <p className="font-bold">Controle Organizacional</p>
                              <p className="text-[8px] text-slate-400">Modificar colaboradores e cargos</p>
                            </div>
                          </label>

                        </div>
                      </div>

                      {/* Active Toggle Selector */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Estado de Acesso do Colaborador</p>
                          <p className="text-[9px] text-slate-400">Colaboradores inativos têm o acesso geral impedido de forma imediata.</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditUserActive(!editUserActive)}
                          className={`p-1 flex items-center justify-between gap-1.5 px-3 py-1 text-xs font-black rounded-lg cursor-pointer transition-all ${
                            editUserActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/25'
                          }`}
                        >
                          {editUserActive ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Habilitado (Ativo)
                            </>
                          ) : (
                            <>
                              <X className="h-3.5 w-3.5" />
                              Desabilitado (Inativo)
                            </>
                          )}
                        </button>
                      </div>

                      {/* Saving action buttons */}
                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="text-xs font-bold px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-705 dark:text-slate-350 rounded-lg cursor-pointer"
                        >
                          Cancelar Edição
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="text-xs font-bold px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg cursor-pointer"
                        >
                          Salvar Alterações
                        </button>
                      </div>

                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* List group displaying current profiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredUsers.map(u => {
                // Role decorations
                const roleBorders = {
                  'Analista': 'border-t-sky-500',
                  'Supervisor': 'border-t-amber-500',
                  'Gestão': 'border-t-violet-600'
                };

                const roleBadges = {
                  'Analista': 'bg-sky-55 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400',
                  'Supervisor': 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400',
                  'Gestão': 'bg-violet-50 text-violet-750 dark:bg-violet-950/25 dark:text-violet-400'
                };

                const reportsToUser = u.reportsToUserId ? users.find(item => item.id === u.reportsToUserId) : null;

                return (
                  <div
                    key={u.id}
                    className={`bg-white dark:bg-slate-900 border-t-4 ${roleBorders[u.role] || roleBorders['Analista']} border-b border-x border-slate-200 dark:border-slate-800 p-4.5 rounded-xl text-center space-y-3 relative overflow-hidden transition-all hover:shadow-xs ${
                      u.active === false ? 'opacity-55 scale-[0.98]' : ''
                    }`}
                  >
                    <img 
                      src={u.avatar} 
                      alt={u.name} 
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-slate-100 dark:border-slate-800"
                    />

                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate" title={u.name}>{u.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                    </div>

                    <div className="flex justify-center items-center gap-1">
                      <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${roleBadges[u.role] || roleBadges['Analista']}`}>
                        {u.role}
                      </span>
                      {u.active === false ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/25 dark:text-rose-400">
                          Inativo
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-500 block">
                          ● {u.status}
                        </span>
                      )}
                    </div>

                    {/* Reporting visual mapping */}
                    <div className="text-[9px] text-slate-400 select-none pb-1 font-semibold">
                      {reportsToUser ? (
                        <span>Responde para: <b>{reportsToUser.name}</b></span>
                      ) : (
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold uppercase text-[8px] tracking-wide">Diretor / Gestão Alta</span>
                      )}
                    </div>

                    {/* Permissions tags indicators */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-850 flex items-center justify-center gap-1.5 text-[9px] text-slate-400">
                      <Shield className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <div className="flex flex-wrap gap-0.5 justify-center">
                        {u.permissions?.canEditSettings && <span className="px-1 bg-slate-100 dark:bg-slate-800 rounded text-[7px]" title="Ajustes">Regs</span>}
                        {u.permissions?.canCreateProjects && <span className="px-1 bg-slate-100 dark:bg-slate-800 rounded text-[7px]" title="Projetos">Proj</span>}
                        {u.permissions?.canRegisterMeetings && <span className="px-1 bg-slate-100 dark:bg-slate-800 rounded text-[7px]" title="Reunião">Atas</span>}
                        {u.permissions?.canManageUsers && <span className="px-1 bg-slate-100 dark:bg-slate-800 rounded text-[7px]" title="Usuarios">User</span>}
                      </div>
                    </div>

                    {/* Bottom actions on user card */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-center gap-1.5 select-none">
                      
                      <button
                        onClick={() => handleInitiateEdit(u)}
                        className="p-1 px-2.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all border border-slate-100 dark:border-slate-800"
                        title="Editar Perfil"
                      >
                        <Edit2 className="h-3 w-3" />
                        Editar
                      </button>

                      <button
                        onClick={() => handleToggleUserActive(u)}
                        className={`p-1 px-2 rounded font-bold text-[10px] cursor-pointer transition-all ${
                          u.active === false
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 border border-emerald-250'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 border border-rose-250 dark:border-rose-950 hover:bg-rose-100'
                        }`}
                        title={u.active === false ? 'Habilitar Colaborador' : 'Suspender/Desativar Acesso'}
                      >
                        {u.active === false ? 'Ativar' : 'Desativar'}
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* TAB 3: MATRIZ DE ACESSOS E POLÍTICAS */}
        {activeTab === 'permissions' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-150 dark:border-slate-800">
              <Shield className="h-5 w-5 text-indigo-500" />
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm font-sans">Matriz de Níveis de Acesso e Direitos</h3>
                <p className="text-[10px] text-slate-400">Exibindo limites de regras lógicas de permissão padrão por nível funcional</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-850 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-3.5">Ações / Capabilidades da Plataforma</th>
                    <th className="p-3.5 text-center w-28">Analista</th>
                    <th className="p-3.5 text-center w-28">Supervisão</th>
                    <th className="p-3.5 text-center w-28">Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-705 dark:text-slate-250 font-medium select-none">
                  {rolePermissions.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                      <td className="p-3.5 text-slate-800 dark:text-slate-205 font-semibold">{row.cap}</td>
                      <td className="p-3.5 text-center">
                        {row.analista ? (
                          <span className="text-emerald-500 font-extrabold text-base">✓</span>
                        ) : (
                          <span className="text-slate-350 dark:text-slate-700 font-bold">✕</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {row.supervisor ? (
                          <span className="text-emerald-500 font-extrabold text-base">✓</span>
                        ) : (
                          <span className="text-slate-350 dark:text-slate-700 font-bold">✕</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {row.gestao ? (
                          <span className="text-emerald-500 font-extrabold text-base">✓</span>
                        ) : (
                          <span className="text-slate-350 dark:text-slate-700 font-bold">✕</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 4: TRILHA DE AUDITORIA (LOGS) */}
        {activeTab === 'logs' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            
            <div className="p-4 border-b border-slate-150 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-350 uppercase tracking-wide">Trilha de Auditoria Geral (Audit trail)</h3>
              <span className="text-[10px] text-slate-400">Registro histórico das ações de governança corporativa em tempo real</span>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left font-sans border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/20 text-[9px] font-extrabold text-slate-400 dark:text-slate-550 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                    <th className="p-3 pl-5">Horário utc</th>
                    <th className="p-3">Colaborador</th>
                    <th className="p-3">Nível (Role)</th>
                    <th className="p-3">Operação efetuada</th>
                    <th className="p-3">Contexto</th>
                    <th className="p-3 flex items-center gap-1 py-3">
                      <span>Detalhes do Registro</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] text-slate-650 dark:text-slate-350">
                  {logs.map((log) => {
                    const formattedDate = new Date(log.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 font-medium">
                        <td className="p-3 pl-5 font-mono text-slate-400 select-none">
                          {formattedDate}
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-150">
                          {log.userName}
                        </td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/25">
                            {log.userRole}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-705 dark:text-slate-150">
                          {log.action}
                        </td>
                        <td className="p-3 font-semibold text-slate-400 font-mono text-[10px]">
                          {log.targetType} / {log.targetId}
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 max-w-sm truncate animate-fade-in" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    );
                  })}

                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Nenhum registro de log de auditoria encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
