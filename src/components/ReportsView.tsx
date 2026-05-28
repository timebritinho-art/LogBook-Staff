import React, { useState, useEffect } from 'react';
import { AppApi } from '../services/api';
import { DiarioEntry, Project } from '../types';
import { motion } from 'motion/react';
import { 
  FileText, Search, Download, Calendar, Filter, Clock, 
  Tag, BarChart2, BookOpen, Printer, Check, Copy 
} from 'lucide-react';

interface ReportsViewProps {
  projects: Project[];
  diaries: DiarioEntry[];
}

export default function ReportsView({ projects, diaries }: ReportsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Totals calculations
  const totalReportedSeconds = diaries.reduce((acc, d) => {
    if (selectedProjectId !== 'all' && d.projectId !== selectedProjectId) return acc;
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return acc;
    if (searchTerm && !d.performedText.toLowerCase().includes(searchTerm.toLowerCase())) return acc;
    return acc + d.timeSpentSeconds;
  }, 0);

  const totalReportedHours = (totalReportedSeconds / 3600).toFixed(1);

  // Filtered diaries array matches table
  const viewDiaries = diaries.filter(d => {
    if (selectedProjectId !== 'all' && d.projectId !== selectedProjectId) return false;
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        d.performedText.toLowerCase().includes(term) ||
        d.problemsText.toLowerCase().includes(term) ||
        d.userName.toLowerCase().includes(term) ||
        d.projectName.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    // Generate simple CSV content
    const headers = ['Data', 'Usuario', 'Cargo', 'Projeto', 'Categoria', 'Horas', 'Atividade Realizada', 'Problemas', 'Status'];
    const rows = viewDiaries.map(d => [
      d.date,
      `"${d.userName.replace(/"/g, '""')}"`,
      d.userRole,
      `"${d.projectName.replace(/"/g, '""')}"`,
      d.category,
      (d.timeSpentSeconds / 3600).toFixed(1),
      `"${d.performedText.replace(/"/g, '""').substring(0, 100)}..."`,
      `"${(d.problemsText || '').replace(/"/g, '""')}"`,
      d.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_staff_britania_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyRowText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="reports-view-root">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Relatórios e Auditoria
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Extração de logs operacionais consolidados. Filtre horas trabalhadas e exporte os dados para prestação de contas.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="self-start md:self-auto flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          Exportar Excel (CSV)
        </button>
      </div>

      {/* Aggregate KPI Overview banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total de Carga Auditada</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">{totalReportedHours} horas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Diários Correspondentes</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">{viewDiaries.length} diários</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Média Diária por Diário</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {viewDiaries.length > 0 ? (totalReportedSeconds / viewDiaries.length / 3600).toFixed(1) : '0'}h
            </span>
          </div>
        </div>

      </div>

      {/* Advanced search widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row gap-3">
          
          <div className="flex-1 relative">
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digitar palavra-chave operacional para auditagem rápida..."
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center">
            
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-850 p-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg select-none outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Filtro de Projetos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-850 p-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Categorias</option>
              <option value="Desenvolvimento">Desenvolvimento</option>
              <option value="Suporte(Chamado)">Suporte(Chamado)</option>
              <option value="Reunião">Reunião</option>
              <option value="Monitoramento">Monitoramento</option>
              <option value="Infraestrutura">Infraestrutura</option>
              <option value="Documentação">Documentação</option>
              <option value="Melhoria">Melhoria</option>
            </select>

          </div>

        </div>

      </div>

      {/* Main Table view of the items */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-5">Data</th>
                <th className="p-4">Colaborador</th>
                <th className="p-4">Projeto</th>
                <th className="p-4">Categoria</th>
                <th className="p-4 text-center">Horas</th>
                <th className="p-4 max-w-sm">Sumário da Atividade</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-250">
              {viewDiaries.map((diary, idx) => {
                const isCopied = copiedIndex === idx;
                return (
                  <tr key={diary.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all">
                    <td className="p-4 pl-5 font-mono text-[11px] text-slate-400 shrink-0">
                      {diary.date}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                        {diary.userName}
                      </div>
                      <span className="text-[10px] text-slate-400 leading-none">{diary.userRole}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350">
                        {diary.projectName}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400">
                        {diary.category}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold">
                      {(diary.timeSpentSeconds / 3600).toFixed(1)}h
                    </td>
                    <td className="p-4 max-w-xs md:max-w-md">
                      <p className="line-clamp-2 leading-relaxed text-slate-500 dark:text-slate-400">
                        {diary.performedText}
                      </p>
                      {diary.problemsText && (
                        <span className="text-[10px] font-semibold text-rose-500 block">
                          Impedimento: {diary.problemsText}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleCopyRowText(diary.performedText, idx)}
                        className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 shrink-0 cursor-pointer ${
                          isCopied ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'text-slate-400'
                        }`}
                        title="Copiar texto da atividade"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {viewDiaries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                    Nenhum registro de log para consolidar neste relatório de busca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
