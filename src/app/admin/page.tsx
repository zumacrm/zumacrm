"use client";

import { useState, useEffect } from "react";
import DashboardCalendar from "@/components/DashboardCalendar";
import ManualBookingModal from "@/components/ManualBookingModal";
import MedicoConfigModal from "@/components/MedicoConfigModal";
import { 
  Users, 
  Calendar as CalendarIcon, 
  Settings, 
  DollarSign, 
  Clock, 
  Plus, 
  ShieldAlert, 
  RefreshCw,
  Loader2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [runningCleanup, setRunningCleanup] = useState<boolean>(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  // Statistics state
  const [stats, setStats] = useState({
    totalHoy: 0,
    confirmados: 0,
    preReservados: 0,
    recaudadoSenia: 0
  });
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  // Load stats from backend
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/admin/turnos?fecha=${todayStr}`);
      const data = await res.json();
      
      if (data.success) {
        const turnos = data.turnos;
        const totalHoy = turnos.length;
        const confirmados = turnos.filter((t: any) => t.estado_turno === "CONFIRMADO" || t.estado_turno === "ATENDIDO").length;
        const preReservados = turnos.filter((t: any) => t.estado_turno === "PRE_RESERVADO").length;
        
        const recaudadoSenia = turnos.reduce((acc: number, t: any) => {
          if (t.pago && t.pago.estado_pago === "APROBADO") {
            return acc + Number(t.pago.monto_pagado);
          }
          return acc;
        }, 0);

        setStats({ totalHoy, confirmados, preReservados, recaudadoSenia });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchStats();
  };

  const runCleanupJob = async () => {
    setRunningCleanup(true);
    setCleanupMessage(null);
    try {
      const res = await fetch("/api/cron/cleanup");
      const data = await res.json();
      if (data.success) {
        setCleanupMessage(`Limpieza exitosa. Se liberaron ${data.released_count} turnos expirados.`);
        handleRefresh();
      } else {
        setCleanupMessage("Error al correr la limpieza: " + data.error);
      }
    } catch (err) {
      console.error(err);
      setCleanupMessage("Error al conectar con la ruta de limpieza.");
    } finally {
      setRunningCleanup(false);
      setTimeout(() => setCleanupMessage(null), 5000); // Clear message
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      {/* Admin header */}
      <header className="bg-slate-900 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center">
              <CalendarIcon className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base leading-tight">Panel de Administración</h1>
              <p className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">Dr. Carlos Jensen</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/reservar" target="_blank" className="text-xs text-slate-300 hover:text-white transition-colors">
              Ver Turnero Público &rarr;
            </Link>
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700/50 hover:bg-slate-800/80 transition-all cursor-pointer"
              title="Actualizar Datos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        
        {/* STATS HIGHLIGHT ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Turnos de Hoy", val: stats.totalHoy, icon: Users, color: "text-blue-600 bg-blue-50" },
            { label: "Confirmados / Atendidos", val: stats.confirmados, icon: CalendarIcon, color: "text-emerald-600 bg-emerald-50" },
            { label: "Pendientes de Seña", val: stats.preReservados, icon: Clock, color: "text-amber-600 bg-amber-50" },
            { label: "Recaudado Señas", val: `$${stats.recaudadoSenia.toLocaleString("es-AR")}`, icon: DollarSign, color: "text-teal-600 bg-teal-50" }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                  {loadingStats ? (
                    <div className="h-6 w-12 bg-slate-100 animate-pulse rounded mt-1" />
                  ) : (
                    <p className="text-lg font-bold text-slate-800 mt-0.5">{stat.val}</p>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* UTILITIES & CRON CONTROLS BANNER */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 justify-center md:justify-start">
              <ShieldAlert className="w-4.5 h-4.5 text-primary" /> Lógica Anti No-Show Activa (15 Minutos)
            </span>
            <p className="text-[10px] text-slate-400 leading-normal max-w-md">
              Los slots pre-reservados expiran automáticamente si no se confirma el pago de la seña. Utiliza el botón de la derecha para simular la ejecución periódica del cron de limpieza.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {cleanupMessage && (
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-2 rounded-lg animate-pulse">
                {cleanupMessage}
              </span>
            )}
            
            <button
              onClick={runCleanupJob}
              disabled={runningCleanup}
              className="flex-1 md:flex-initial bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {runningCleanup ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Corriendo cron...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Simular Cron de Limpieza
                </>
              )}
            </button>

            <button
              onClick={() => setIsConfigOpen(true)}
              className="flex-1 md:flex-initial bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              Configurar Horarios
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-initial bg-primary hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-xl text-xs shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" />
              Nuevo Turno Manual
            </button>
          </div>
        </div>

        {/* INTERACTIVE CALENDAR BOARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Agenda de Turnos Médicos
          </h2>
          
          <DashboardCalendar onRefreshTrigger={refreshTrigger} />
        </div>
      </main>

      {/* Manual reservation modal */}
      <ManualBookingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {/* Settings config modal */}
      <MedicoConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
