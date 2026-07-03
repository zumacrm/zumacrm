"use client";

import { useState, useEffect } from "react";
import { mockDB, MockTurno } from "@/lib/mockData";
import { 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  DollarSign, 
  Search, 
  Plus, 
  RefreshCw, 
  X, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  MapPin
} from "lucide-react";
import { 
  format, 
  addDays, 
  subDays, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  subMonths, 
  addMonths 
} from "date-fns";
import { es } from "date-fns/locale";

export default function AgendaView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [turnos, setTurnos] = useState<MockTurno[]>([]);
  const [selectedTurno, setSelectedTurno] = useState<MockTurno | null>(null);
  
  // Custom states for view layout and locations dropdown filters
  const [calendarViewMode, setCalendarViewMode] = useState<"day" | "month">("day");
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>("Todas");
  
  // Modals and notifications states
  const [showManualModal, setShowManualModal] = useState(false);
  const [runningCron, setRunningCron] = useState(false);
  const [cronMessage, setCronMessage] = useState<string | null>(null);

  // Form state for new manual booking
  const [formData, setFormData] = useState({
    hora: "09:00",
    tipoEstudio: "Consulta general",
    consultorio: "Sanatorio Central Banda",
    dni: "",
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    obraSocial: "Particular",
    pagaEnConsultorio: true
  });

  const loadTurnos = () => {
    const list = mockDB.getTurnos();
    setTurnos(list);
    
    // Maintain selection link updated if details drawer is open
    if (selectedTurno) {
      const updated = list.find(t => t.id === selectedTurno.id);
      setSelectedTurno(updated || null);
    }
  };

  useEffect(() => {
    loadTurnos();
  }, []);

  const handlePrevPeriod = () => {
    if (calendarViewMode === "day") {
      setSelectedDate(prev => subDays(prev, 1));
    } else {
      setSelectedDate(prev => subMonths(prev, 1));
    }
  };

  const handleNextPeriod = () => {
    if (calendarViewMode === "day") {
      setSelectedDate(prev => addDays(prev, 1));
    } else {
      setSelectedDate(prev => addMonths(prev, 1));
    }
  };

  const handleRunCron = () => {
    setRunningCron(true);
    setCronMessage(null);
    setTimeout(() => {
      const count = mockDB.runCronCleanup();
      loadTurnos();
      setRunningCron(false);
      setCronMessage(count > 0 ? `Se liberaron ${count} slots expirados` : "Ningún slot vencido detectado");
      setTimeout(() => setCronMessage(null), 3000);
    }, 600);
  };

  const handleUpdateStatus = (turnoId: string, status: MockTurno["estado_turno"]) => {
    mockDB.updateTurnoStatus(turnoId, status);
    loadTurnos();
  };

  // Form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Manual booking submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dni || !formData.nombre || !formData.apellido) return;

    const studyCost = formData.tipoEstudio === "Ergometría" ? 45000 : 
                      formData.tipoEstudio === "Electrocardiograma" ? 24000 : 
                      formData.tipoEstudio === "Ecocardiograma" ? 36000 : 30000;

    mockDB.addTurno({
      paciente: {
        dni: formData.dni,
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono || "+549385000000",
        email: formData.email || "particular@gmail.com",
        obra_social: formData.obraSocial
      },
      fecha: format(selectedDate, "yyyy-MM-dd"),
      hora_inicio: formData.hora,
      hora_fin: format(addDays(new Date(`2026-01-01T${formData.hora}:00`), 0), "HH:mm"), // placeholder end
      tipo_estudio: formData.tipoEstudio,
      consultorio: formData.consultorio,
      estado_turno: formData.pagaEnConsultorio ? "CONFIRMADO" : "PRE_RESERVADO",
      via_reserva: "SECRETARIA",
      pago: {
        monto_total: studyCost,
        monto_pagado: formData.pagaEnConsultorio ? 0 : studyCost / 2,
        checkout_id: formData.pagaEnConsultorio ? "PAGA_EN_CONSULTORIO" : `pref_${Math.random().toString(36).substring(2, 7)}`,
        estado_pago: "PENDIENTE"
      }
    });

    loadTurnos();
    setShowManualModal(false);
    // Reset form
    setFormData({
      hora: "09:00",
      tipoEstudio: "Consulta general",
      consultorio: "Sanatorio Central Banda",
      dni: "",
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      obraSocial: "Particular",
      pagaEnConsultorio: true
    });
  };

  // Dynamic list of locations from turnos database
  const partnerLocations = Array.from(new Set(turnos.map(t => t.consultorio)));

  // Filter turnos based on active branch location selection and search criteria
  const baseFilteredTurnos = turnos.filter(t => {
    const matchesLocation = selectedLocationFilter === "Todas" || t.consultorio === selectedLocationFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = t.paciente.nombre.toLowerCase().includes(query) || 
                          t.paciente.apellido.toLowerCase().includes(query) || 
                          t.paciente.dni.includes(query) || 
                          t.tipo_estudio.toLowerCase().includes(query);
    return matchesLocation && matchesSearch;
  });

  const formattedSelectedDate = format(selectedDate, "yyyy-MM-dd");
  // Day turnos specifically
  const dayTurnos = baseFilteredTurnos.filter(t => t.fecha === formattedSelectedDate);
  const filteredTurnos = dayTurnos;

  // Calculate statistics for selected date
  const totalHoy = dayTurnos.length;
  const totalConfirmados = dayTurnos.filter(t => t.estado_turno === "CONFIRMADO" || t.estado_turno === "ATENDIDO").length;
  const totalPreReservados = dayTurnos.filter(t => t.estado_turno === "PRE_RESERVADO").length;
  const totalRecaudado = dayTurnos.reduce((acc, t) => {
    if (t.pago && t.pago.estado_pago === "APROBADO") { // custom check
      return acc + t.pago.monto_pagado;
    }
    // standard check fallback
    if (t.pago && (t.estado_turno === "CONFIRMADO" || t.estado_turno === "ATENDIDO") && t.pago.checkout_id !== "PAGA_EN_CONSULTORIO") {
      return acc + t.pago.monto_pagado;
    }
    return acc;
  }, 0);

  // Status visual themes
  const getStatusBadge = (t: MockTurno) => {
    if (t.estado_turno === "CONFIRMADO") return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "Confirmado", dot: "bg-emerald-500" };
    if (t.estado_turno === "ATENDIDO") return { bg: "bg-teal-50 text-teal-700 border-teal-200", text: "Atendido", dot: "bg-teal-500" };
    if (t.estado_turno === "PRE_RESERVADO") return { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "Pre-Reservado", dot: "bg-amber-500 animate-pulse" };
    if (t.estado_turno === "CANCELADO_MEDICO") return { bg: "bg-rose-50 text-rose-700 border-rose-200", text: "Cancelado (Médico)", dot: "bg-rose-500" };
    return { bg: "bg-slate-50 text-slate-400 border-slate-200", text: "Cancelado (Paciente)", dot: "bg-slate-400" };
  };

  const getPaymentBadge = (t: MockTurno) => {
    if (!t.pago) return { bg: "bg-slate-50 text-slate-400 border-slate-200", text: "Sin Pago" };
    if (t.pago.checkout_id === "PAGA_EN_CONSULTORIO") return { bg: "bg-indigo-50 border-indigo-200 text-indigo-700", text: "Paga en Consultorio" };
    if (t.estado_turno === "CONFIRMADO" || t.estado_turno === "ATENDIDO") return { bg: "bg-emerald-50 border-emerald-200 text-emerald-700", text: "Seña Aprobada" };
    return { bg: "bg-amber-50 border-amber-200 text-amber-700 animate-pulse", text: "Seña Pendiente" };
  };

  const hoursList = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  return (
    <div className="flex flex-col gap-6 animate-slide-in">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Mi Agenda de Turnos</h1>
          <p className="text-xs text-slate-400">Dr. Carlos Jensen &bull; Agenda de atención por consultorios habilitados.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunCron}
            disabled={runningCron}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {runningCron ? <RefreshCw className="w-4 h-4 animate-spin text-slate-500" /> : <RefreshCw className="w-4 h-4 text-slate-500" />}
            Simular Cron
          </button>
          
          <button
            onClick={() => setShowManualModal(true)}
            className="bg-primary hover:bg-teal-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            Nuevo Turno Manual
          </button>
        </div>
      </div>

      {cronMessage && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-shake">
          <ShieldCheck className="w-5 h-5 shrink-0 text-teal-600" />
          <span>{cronMessage}</span>
        </div>
      )}

      {/* Date controls and search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        {/* Date navigators */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={handlePrevPeriod} 
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <span className="font-bold text-slate-700 text-xs sm:text-sm whitespace-nowrap">
              {calendarViewMode === "day" 
                ? format(selectedDate, "eeee dd 'de' MMMM, yyyy", { locale: es })
                : format(selectedDate, "MMMM 'de' yyyy", { locale: es })}
            </span>
          </div>
          <button 
            onClick={handleNextPeriod} 
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Switcher and Location Filter Dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Sede selector */}
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedLocationFilter}
              onChange={(e) => {
                setSelectedLocationFilter(e.target.value);
                setSelectedTurno(null);
              }}
              className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold text-slate-650 cursor-pointer focus:outline-none focus:border-primary"
            >
              <option value="Todas">Todas las sedes</option>
              {partnerLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Day / Month switch control */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-0.5 flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setCalendarViewMode("day")}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all
                ${calendarViewMode === "day" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Día
            </button>
            <button
              type="button"
              onClick={() => setCalendarViewMode("month")}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all
                ${calendarViewMode === "month" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Mes
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por paciente o DNI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary bg-slate-50/50 text-slate-700 font-semibold"
          />
        </div>
      </div>

      {/* Analytics toolbar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Turnos de Hoy", val: totalHoy, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Confirmados", val: totalConfirmados, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Pendientes seña", val: totalPreReservados, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "Recaudado Señas", val: `$${totalRecaudado.toLocaleString("es-AR")}`, icon: DollarSign, color: "text-teal-600 bg-teal-50" }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col gap-2.5 min-w-0 overflow-hidden">
              {/* Top row: Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              {/* Bottom row: Value and label stacked */}
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">{stat.label}</span>
                <p className="text-base font-bold text-slate-800 mt-0.5 leading-none truncate">{stat.val}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main split dashboard list + details drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Booking slot list or Monthly Grid view */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {calendarViewMode === "month" ? (
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Calendario Mensual de Reservas</h3>
              
              {/* Month calendar grid */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 border-b border-slate-100 pb-2">
                <span>LUN</span>
                <span>MAR</span>
                <span>MIÉ</span>
                <span>JUE</span>
                <span>VIE</span>
                <span>SÁB</span>
                <span>DOM</span>
              </div>
              
              <div className="grid grid-cols-7 gap-1.5 mt-1">
                {(() => {
                  const monthStart = startOfMonth(selectedDate);
                  const monthEnd = endOfMonth(monthStart);
                  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
                  const daySheet = eachDayOfInterval({ start: startDate, end: endDate });
                  
                  return daySheet.map((day, idx) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const isCurrentMonth = isSameMonth(day, selectedDate);
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    
                    // Filter non-cancelled appointments for this day
                    const cellTurnos = baseFilteredTurnos.filter(t => 
                      t.fecha === dateStr && 
                      t.estado_turno !== "CANCELADO_PACIENTE" && 
                      t.estado_turno !== "CANCELADO_MEDICO"
                    );
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedDate(day);
                          // Auto switch view to day agenda
                          setCalendarViewMode("day");
                        }}
                        className={`min-h-[70px] p-2 border border-slate-100 rounded-xl transition-all flex flex-col justify-between cursor-pointer select-none hover:bg-slate-50/50 hover:border-indigo-200
                          ${!isCurrentMonth ? "opacity-30" : ""}
                          ${isToday ? "bg-teal-50/30 border-teal-200" : "bg-white"}
                          ${isSelected ? "ring-2 ring-indigo-500 border-transparent shadow-sm bg-indigo-50/10" : ""}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-bold ${isToday ? "text-teal-600 bg-teal-50 px-1 py-0.2 rounded" : "text-slate-650"}`}>
                            {format(day, "d")}
                          </span>
                          {cellTurnos.length > 0 && (
                            <span className="text-[8px] font-extrabold text-white bg-indigo-600 px-1 py-0.2 rounded shadow-sm">
                              {cellTurnos.length}
                            </span>
                          )}
                        </div>
                        
                        {/* Cell indicators list */}
                        {cellTurnos.length > 0 && (
                          <div className="mt-1 flex flex-col gap-0.5 truncate text-left max-w-full overflow-hidden">
                            {cellTurnos.slice(0, 2).map((turno) => {
                              const isPre = turno.estado_turno === "PRE_RESERVADO";
                              return (
                                <div 
                                  key={turno.id} 
                                  className={`text-[7px] font-bold truncate rounded px-1 py-0.5
                                    ${isPre ? "bg-amber-50 text-amber-600 border border-amber-100/50" : "bg-emerald-50 text-emerald-600 border border-emerald-100/50"}`}
                                >
                                  {turno.hora_inicio} {turno.paciente.nombre}
                                </div>
                              );
                            })}
                            {cellTurnos.length > 2 && (
                              <span className="text-[6.5px] font-semibold text-slate-400 pl-0.5">
                                +{cellTurnos.length - 2} más
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : filteredTurnos.length === 0 ? (
            <div className="bg-white border border-slate-200 p-12 text-center rounded-2xl flex flex-col items-center gap-3">
              <CalendarIcon className="w-12 h-12 text-slate-300 stroke-[1.2]" />
              <h3 className="font-semibold text-slate-700 text-sm">Sin turnos agendados</h3>
              <p className="text-xs text-slate-400 max-w-xs">No hay reservas vigentes registradas para el día de hoy que coincidan con la búsqueda.</p>
            </div>
          ) : (
            filteredTurnos.map(t => {
              const status = getStatusBadge(t);
              const isSelected = selectedTurno?.id === t.id;
              
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTurno(t)}
                  className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer transition-all hover:border-slate-300
                    ${isSelected ? "ring-2 ring-primary border-primary shadow-md shadow-primary/5" : "border-slate-200 shadow-sm"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${status.dot}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-400">{t.hora_inicio} hs</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${status.bg}`}>
                          {status.text}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm mt-0.5">
                        {t.paciente.nombre} {t.paciente.apellido}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t.tipo_estudio} &bull; <span className="font-semibold text-slate-500">{t.consultorio}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 self-end sm:self-center">
                    <span className="text-xs font-bold text-slate-700">
                      ${t.pago?.monto_total.toLocaleString("es-AR") || "0"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right drawer - details */}
        <div>
          {selectedTurno ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 sticky top-6 animate-slide-in">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Detalles del Turno</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">ID: {selectedTurno.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedTurno(null)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Patient data cards */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex flex-col gap-2">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Datos Paciente</span>
                <div>
                  <h4 className="font-semibold text-slate-800 text-xs">
                    {selectedTurno.paciente.nombre} {selectedTurno.paciente.apellido}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">DNI: {selectedTurno.paciente.dni}</p>
                </div>
                
                <div className="flex flex-col gap-1 text-[10px] text-slate-400 mt-1 border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>{selectedTurno.paciente.telefono}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{selectedTurno.paciente.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-500">
                    <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Obra Social: {selectedTurno.paciente.obra_social}</span>
                  </div>
                </div>
              </div>

              {/* Study detail card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex flex-col gap-2">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estudio y Horario</span>
                <div className="flex flex-col gap-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold">{selectedTurno.tipo_estudio}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold text-teal-600">{selectedTurno.consultorio}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedTurno.hora_inicio} hs</span>
                  </div>
                </div>
              </div>

              {/* Payment state card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex flex-col gap-2">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cobros</span>
                {selectedTurno.pago ? (
                  <div className="flex flex-col gap-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total consulta:</span>
                      <span className="font-bold">${selectedTurno.pago.monto_total.toLocaleString("es-AR")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Depositado:</span>
                      <span className="font-bold text-teal-600">${selectedTurno.pago.monto_pagado.toLocaleString("es-AR")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estado Pago:</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${getPaymentBadge(selectedTurno).bg}`}>
                        {getPaymentBadge(selectedTurno).text}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">No registra pagos asociados.</span>
                )}
              </div>

              {/* WhatsApp notification simulation button */}
              <a
                href={`https://wa.me/${selectedTurno.paciente.telefono.replace(/\s+/g, "").replace("+", "")}?text=${encodeURIComponent(
                  `Hola ${selectedTurno.paciente.nombre}, le escribimos de la secretaría del Dr. Carlos Jensen para recordarle su turno de ${selectedTurno.tipo_estudio} el día ${format(selectedDate, "dd/MM")} a las ${selectedTurno.hora_inicio} hs en ${selectedTurno.consultorio}. ¡Muchas gracias!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Contactar por WhatsApp
              </a>

              {/* Action operations buttons */}
              <div className="flex flex-col gap-1.5 mt-2 border-t border-slate-100 pt-3">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Acciones Administrativas</span>
                
                {selectedTurno.estado_turno === "CONFIRMADO" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedTurno.id, "ATENDIDO")}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Marcar como Atendido
                  </button>
                )}

                {(selectedTurno.estado_turno === "CONFIRMADO" || selectedTurno.estado_turno === "PRE_RESERVADO") && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedTurno.id, "CANCELADO_MEDICO")}
                      className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancelar (Médico)
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedTurno.id, "CANCELADO_PACIENTE")}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Ausente / Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center text-slate-400 text-xs italic sticky top-6">
              Seleccione una reserva de la lista para ver el panel de detalles del paciente.
            </div>
          )}
        </div>
      </div>

      {/* NEW MANUAL BOOKING DIALOG MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-100 shadow-xl overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-sm">Registrar Turno Manual</h3>
              <button 
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Hora inicio</label>
                  <select
                    name="hora"
                    value={formData.hora}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary bg-white"
                  >
                    {hoursList.map(h => (
                      <option key={h} value={h}>{h} hs</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Lugar</label>
                  <select
                    name="consultorio"
                    value={formData.consultorio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="Sanatorio Central Banda">Sanatorio Central Banda</option>
                    <option value="Clínica Del Pilar">Clínica Del Pilar</option>
                    <option value="Centro Médico Cannon">Centro Médico Cannon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Estudio / Práctica</label>
                <select
                  name="tipoEstudio"
                  value={formData.tipoEstudio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary bg-white"
                >
                  <option value="Consulta general">Consulta General ($30.000)</option>
                  <option value="Electrocardiograma">Electrocardiograma ($24.000)</option>
                  <option value="Ergometría">Ergometría ($45.000)</option>
                  <option value="Ecocardiograma">Ecocardiograma ($36.000)</option>
                </select>
              </div>

              <div className="h-px bg-slate-100 my-1" />
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider -mb-2">Datos Paciente</span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="ej. Juan"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    placeholder="ej. Pérez"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">DNI</label>
                  <input
                    type="text"
                    required
                    name="dni"
                    value={formData.dni}
                    onChange={handleInputChange}
                    placeholder="DNI"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="+54911..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Prepaga</label>
                  <select
                    name="obraSocial"
                    value={formData.obraSocial}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="Particular">Particular</option>
                    <option value="OSDE">OSDE</option>
                    <option value="Swiss Medical">Swiss Medical</option>
                    <option value="Galeno">Galeno</option>
                  </select>
                </div>
              </div>

              {/* Confirm flags */}
              <div className="flex items-center gap-2 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                <input
                  type="checkbox"
                  name="pagaEnConsultorio"
                  id="pagaEnConsultorio"
                  checked={formData.pagaEnConsultorio}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 accent-teal-600 cursor-pointer"
                />
                <label htmlFor="pagaEnConsultorio" className="text-[10px] text-slate-500 font-semibold cursor-pointer">
                  Confirmar Directamente (Paga en consultorio, omitir seña)
                </label>
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-teal-600 text-white font-bold py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  Agendar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
