"use client";

import { useState, useEffect } from "react";
import { 
  format, 
  addDays, 
  subDays, 
  startOfWeek, 
  addWeeks, 
  subWeeks, 
  isSameDay, 
  parseISO 
} from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Clock, 
  FileText, 
  Search, 
  Check, 
  X as XIcon, 
  MessageCircle, 
  CreditCard, 
  UserCheck, 
  Loader2,
  MapPin
} from "lucide-react";

interface DashboardCalendarProps {
  onRefreshTrigger: number;
}

export default function DashboardCalendar({ onRefreshTrigger }: DashboardCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "list">("day");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTurno, setSelectedTurno] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Load turnos when date or view mode changes
  const fetchTurnos = async () => {
    setLoading(true);
    const dateStr = format(currentDate, "yyyy-MM-dd");
    let url = `/api/admin/turnos?fecha=${dateStr}`;
    
    if (viewMode === "list") {
      // Load current week list
      const start = format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const end = format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), "yyyy-MM-dd");
      url = `/api/admin/turnos?start=${start}&end=${end}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTurnos(data.turnos);
        // Sync selected appointment reference if open
        if (selectedTurno) {
          const fresh = data.turnos.find((t: any) => t.id === selectedTurno.id);
          setSelectedTurno(fresh || null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurnos();
  }, [currentDate, viewMode, onRefreshTrigger]);

  // Update status (e.g. Cancel or Mark Attended)
  const handleUpdateStatus = async (turnoId: string, status: string) => {
    setUpdatingId(turnoId);
    try {
      const res = await fetch("/api/admin/turnos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnoId, estado: status })
      });
      const data = await res.json();
      if (data.success) {
        await fetchTurnos();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Navigations
  const handlePrev = () => {
    if (viewMode === "day") {
      setCurrentDate(prev => subDays(prev, 1));
    } else {
      setCurrentDate(prev => subWeeks(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "day") {
      setCurrentDate(prev => addDays(prev, 1));
    } else {
      setCurrentDate(prev => addWeeks(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Color mappings for badges and cards
  const getStatusColors = (status: string) => {
    switch (status) {
      case "PRE_RESERVADO":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-700",
          dot: "bg-amber-500",
          text: "Pre-reservado (15 min)"
        };
      case "CONFIRMADO":
        return {
          bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
          dot: "bg-emerald-500",
          text: "Confirmado (Señado)"
        };
      case "ATENDIDO":
        return {
          bg: "bg-blue-50 border-blue-200 text-blue-700",
          dot: "bg-blue-500",
          text: "Atendido"
        };
      case "CANCELADO_PACIENTE":
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-600",
          dot: "bg-rose-500",
          text: "Cancelado Paciente"
        };
      case "CANCELADO_MEDICO":
        return {
          bg: "bg-slate-50 border-slate-200 text-slate-500",
          dot: "bg-slate-400",
          text: "Cancelado Médico"
        };
      default:
        return {
          bg: "bg-slate-100 border-slate-200 text-slate-700",
          dot: "bg-slate-500",
          text: status
        };
    }
  };

  // Filter appointments by search query (DNI or lastname)
  const filteredTurnos = turnos.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const dniMatch = t.paciente.dni.toLowerCase().includes(query);
    const nameMatch = `${t.paciente.nombre} ${t.paciente.apellido}`.toLowerCase().includes(query);
    const studyMatch = t.tipo_estudio.toLowerCase().includes(query);
    return dniMatch || nameMatch || studyMatch;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Main Agenda Grid */}
      <div className="flex-1 w-full flex flex-col gap-4">
        {/* Dashboard sub-header Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
            >
              Hoy
            </button>
            <div className="flex items-center">
              <button
                onClick={handlePrev}
                className="p-1.5 border border-slate-200 border-r-0 rounded-l-lg hover:bg-slate-50 text-slate-500 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 border border-slate-200 rounded-r-lg hover:bg-slate-50 text-slate-500 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-sm font-bold text-slate-800 capitalize ml-1">
              {viewMode === "day"
                ? format(currentDate, "EEEE d 'de' MMMM", { locale: es })
                : `Semana del ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d/MM")} al ${format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), "d/MM/yyyy")}`
              }
            </h3>
          </div>

          {/* Toggle Daily vs Weekly List */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
              <button
                onClick={() => { setViewMode("day"); setSelectedTurno(null); }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === "day" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                Día
              </button>
              <button
                onClick={() => { setViewMode("list"); setSelectedTurno(null); }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === "list" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                Semana
              </button>
            </div>
          </div>
        </div>

        {/* Search & Statistics */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por DNI, Nombre de paciente o Práctica..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary shadow-sm"
          />
        </div>

        {/* Turnos Listing Container */}
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-semibold">Cargando agenda de turnos...</p>
          </div>
        ) : filteredTurnos.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-2 text-slate-400">
            <CalendarIcon className="w-12 h-12 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No hay turnos registrados</p>
            <p className="text-xs max-w-xs mx-auto">Prueba buscando en otro día o agregando un turno manual desde el botón superior.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[600px] pr-1">
            {filteredTurnos.map((t) => {
              const status = getStatusColors(t.estado_turno);
              const isSelected = selectedTurno?.id === t.id;
              
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTurno(t)}
                  className={`
                    bg-white border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer transition-all hover:border-slate-300
                    ${isSelected ? "ring-2 ring-primary border-primary shadow-md shadow-primary/5" : "border-slate-200 shadow-sm"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${status.dot}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">{t.hora_inicio} hs - {t.hora_fin} hs</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${status.bg}`}>
                          {status.text}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm mt-0.5">
                        {t.paciente.nombre} {t.paciente.apellido}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.tipo_estudio} • <span className="font-semibold text-slate-600">{t.consultorio}</span> • Obra Social: {t.paciente.obra_social}
                      </p>
                    </div>
                  </div>
                  
                  {/* Small Action Shortcuts */}
                  <div className="flex gap-1.5 self-end sm:self-center">
                    {t.estado_turno === "CONFIRMADO" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(t.id, "ATENDIDO");
                        }}
                        disabled={updatingId !== null}
                        className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100 cursor-pointer"
                        title="Marcar Atendido"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    )}
                    {t.estado_turno !== "CANCELADO_PACIENTE" && t.estado_turno !== "CANCELADO_MEDICO" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Estás seguro de cancelar el turno de ${t.paciente.nombre}?`)) {
                            handleUpdateStatus(t.id, "CANCELADO_MEDICO");
                          }
                        }}
                        disabled={updatingId !== null}
                        className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100 cursor-pointer"
                        title="Cancelar Turno"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL SIDE PANEL (DRAWER) */}
      {selectedTurno && (
        <div className="w-full lg:w-[350px] bg-white border border-slate-200 rounded-2xl p-5 shadow-md flex flex-col gap-4 animate-slide-in shrink-0">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-semibold text-slate-800 text-sm">Detalle de Reserva</h3>
            <button 
              onClick={() => setSelectedTurno(null)} 
              className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"
            >
              <XIcon className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Quick patient/consult profile */}
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Paciente</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-xs">
                    {selectedTurno.paciente.nombre} {selectedTurno.paciente.apellido}
                  </h4>
                  <p className="text-[10px] text-slate-500">DNI: {selectedTurno.paciente.dni}</p>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estudio y Horario</span>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col gap-2 mt-1.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                  <FileText className="w-4 h-4 text-slate-400 font-medium" />
                  <span className="font-medium">{selectedTurno.tipo_estudio}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-teal-600">{selectedTurno.consultorio}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    {format(new Date(selectedTurno.fecha + "T00:00:00"), "dd/MM/yyyy")} a las {selectedTurno.hora_inicio} hs
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cobro y Seña</span>
              {selectedTurno.pago ? (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col gap-1.5 mt-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valor consulta:</span>
                    <span className="font-bold text-slate-700">${Number(selectedTurno.pago.monto_total).toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monto seña:</span>
                    <span className="font-bold text-slate-700">${Number(selectedTurno.pago.monto_pagado).toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200/60 mt-1">
                    <span className="text-slate-600 font-bold">Estado Pago:</span>
                    <span className={`font-extrabold ${selectedTurno.pago.estado_pago === "APROBADO" ? "text-emerald-600" : "text-amber-600"}`}>
                      {selectedTurno.pago.estado_pago}
                    </span>
                  </div>
                  {selectedTurno.pago.checkout_id === "PAGA_EN_CONSULTORIO" && (
                    <span className="text-[9px] bg-slate-200 text-slate-700 py-0.5 px-1.5 rounded self-start mt-1 font-semibold">
                      Agendado Directo (Secretaría)
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1">Sin información de pago.</p>
              )}
            </div>

            {/* Quick WhatsApp contact button */}
            <div className="h-px bg-slate-100 my-1" />

            <div className="flex flex-col gap-2">
              <a
                href={`https://wa.me/${selectedTurno.paciente.telefono.replace(/\s+/g, "").replace("+", "")}?text=${encodeURIComponent(
                  `Hola ${selectedTurno.paciente.nombre}, le escribimos del consultorio del Dr. Carlos Jensen para recordarle su turno de ${selectedTurno.tipo_estudio} el día ${format(new Date(selectedTurno.fecha + "T00:00:00"), "dd/MM")} a las ${selectedTurno.hora_inicio} hs. ¡Muchas gracias!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4.5 h-4.5" />
                Contactar por WhatsApp
              </a>

              {selectedTurno.estado_turno === "CONFIRMADO" && (
                <button
                  onClick={() => handleUpdateStatus(selectedTurno.id, "ATENDIDO")}
                  disabled={updatingId !== null}
                  className="w-full bg-primary hover:bg-teal-600 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-4.5 h-4.5" />
                  Marcar como Atendido
                </button>
              )}

              {selectedTurno.estado_turno !== "CANCELADO_PACIENTE" && selectedTurno.estado_turno !== "CANCELADO_MEDICO" && (
                <button
                  onClick={() => {
                    if (confirm(`¿Estás seguro de cancelar el turno de ${selectedTurno.paciente.nombre}?`)) {
                      handleUpdateStatus(selectedTurno.id, "CANCELADO_MEDICO");
                    }
                  }}
                  disabled={updatingId !== null}
                  className="w-full bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar Turno
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
