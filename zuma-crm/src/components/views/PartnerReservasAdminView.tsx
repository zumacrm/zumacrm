"use client";

import { useState, useEffect } from "react";
import { mockDB, MockTurno, Partner } from "@/lib/mockData";
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Check, 
  Trash2,
  Eye,
  Info,
  DollarSign,
  AlertCircle,
  Phone,
  Mail,
  ShieldAlert
} from "lucide-react";
import { format, parseISO, isToday, isTomorrow, isThisWeek, isThisMonth } from "date-fns";

interface PartnerReservasAdminViewProps {
  partnerId?: string;
}

export default function PartnerReservasAdminView({ partnerId = "dr-carlos-jensen" }: PartnerReservasAdminViewProps) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [turnos, setTurnos] = useState<MockTurno[]>([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Todas");
  const [selectedService, setSelectedService] = useState("Todos");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [selectedDateFilter, setSelectedDateFilter] = useState("Todos");

  // Selection for detailed drawer
  const [selectedBooking, setSelectedBooking] = useState<MockTurno | null>(null);

  const loadData = () => {
    const p = mockDB.getPartners().find(item => item.id === partnerId);
    if (p) setPartner(p);

    const list = mockDB.getTurnos();
    // Filter turnos belonging to this partner
    const filtered = list.filter(t => {
      if (t.partnerId) return t.partnerId === partnerId;
      // Default fallback for original mock data (Jensen's locations)
      if (partnerId === "dr-carlos-jensen") {
        return (
          t.consultorio === "Sanatorio Central Banda" ||
          t.consultorio === "Clínica Del Pilar" ||
          t.consultorio === "Centro Médico Cannon"
        );
      }
      return false;
    });

    // Sort by date (descending) and time
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.hora_inicio}`);
      const dateB = new Date(`${b.fecha}T${b.hora_inicio}`);
      return dateB.getTime() - dateA.getTime();
    });

    setTurnos(filtered);
    
    // Update selected booking detail if active
    if (selectedBooking) {
      const updated = filtered.find(t => t.id === selectedBooking.id);
      setSelectedBooking(updated || null);
    }
  };

  useEffect(() => {
    loadData();
  }, [partnerId]);

  // Unique lists for dropdowns
  const uniqueLocations = Array.from(new Set(turnos.map(t => t.consultorio)));
  const uniqueServices = Array.from(new Set(turnos.map(t => t.tipo_estudio)));

  // Actions
  const handleConfirm = (id: string) => {
    mockDB.updateTurnoStatus(id, "CONFIRMADO");
    loadData();
  };

  const handleAttend = (id: string) => {
    mockDB.updateTurnoStatus(id, "ATENDIDO");
    loadData();
  };

  const handleCancel = (id: string) => {
    if (window.confirm("¿Estás seguro que deseas cancelar esta reserva? Se le notificará al cliente.")) {
      mockDB.updateTurnoStatus(id, "CANCELADO_MEDICO");
      loadData();
    }
  };

  // Filter application
  const filteredTurnos = turnos.filter(t => {
    // 1. Text Search (Patient name, DNI, phone, or ID)
    const matchesSearch = 
      t.paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.paciente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.paciente.dni.includes(searchTerm) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Location filter
    const matchesLocation = selectedLocation === "Todas" || t.consultorio === selectedLocation;

    // 3. Service filter
    const matchesService = selectedService === "Todos" || t.tipo_estudio === selectedService;

    // 4. Status filter
    let matchesStatus = true;
    if (selectedStatus !== "Todos") {
      if (selectedStatus === "PRE_RESERVADO") matchesStatus = t.estado_turno === "PRE_RESERVADO";
      if (selectedStatus === "CONFIRMADO") matchesStatus = t.estado_turno === "CONFIRMADO";
      if (selectedStatus === "ATENDIDO") matchesStatus = t.estado_turno === "ATENDIDO";
      if (selectedStatus === "CANCELADO") {
        matchesStatus = t.estado_turno === "CANCELADO_PACIENTE" || t.estado_turno === "CANCELADO_MEDICO";
      }
    }

    // 5. Date filter
    let matchesDate = true;
    if (selectedDateFilter !== "Todos") {
      const tDate = parseISO(t.fecha);
      if (selectedDateFilter === "Hoy") matchesDate = isToday(tDate);
      else if (selectedDateFilter === "Mañana") matchesDate = isTomorrow(tDate);
      else if (selectedDateFilter === "Semana") matchesDate = isThisWeek(tDate, { weekStartsOn: 1 });
      else if (selectedDateFilter === "Mes") matchesDate = isThisMonth(tDate);
    }

    return matchesSearch && matchesLocation && matchesService && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMADO":
        return { text: "Confirmado", bg: "bg-emerald-50 text-emerald-700 border-emerald-250" };
      case "PRE_RESERVADO":
        return { text: "Pendiente Seña", bg: "bg-amber-50 text-amber-700 border-amber-250" };
      case "ATENDIDO":
        return { text: "Atendido", bg: "bg-indigo-50 text-indigo-700 border-indigo-250" };
      case "CANCELADO_PACIENTE":
        return { text: "Cancelado Paciente", bg: "bg-rose-50 text-rose-700 border-rose-250" };
      case "CANCELADO_MEDICO":
        return { text: "Cancelado Socio", bg: "bg-slate-50 text-slate-600 border-slate-250" };
      default:
        return { text: status, bg: "bg-slate-50 text-slate-600 border-slate-200" };
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-in relative">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Administrar Reservas</h1>
        <p className="text-xs text-slate-400 mt-1">Busca, filtra, gestiona asistencia y cancelaciones de reservas en tiempo real.</p>
      </div>

      {/* Filters Card */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Main search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por DNI, Nombre, Apellido o ID de reserva..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500/50 text-slate-700 font-semibold shadow-inner"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Sede selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ubicación / Sede</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500/40 cursor-pointer"
            >
              <option value="Todas">Todas las sedes</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Práctica selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Práctica / Servicio</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500/40 cursor-pointer"
            >
              <option value="Todos">Todos los servicios</option>
              {uniqueServices.map(srv => (
                <option key={srv} value={srv}>{srv}</option>
              ))}
            </select>
          </div>

          {/* Estado selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estado Reserva</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500/40 cursor-pointer"
            >
              <option value="Todos">Todos los estados</option>
              <option value="PRE_RESERVADO">Pendientes (Sin seña)</option>
              <option value="CONFIRMADO">Confirmados</option>
              <option value="ATENDIDO">Atendidos</option>
              <option value="CANCELADO">Cancelados</option>
            </select>
          </div>

          {/* Fecha selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Período Temporal</label>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500/40 cursor-pointer"
            >
              <option value="Todos">Histórico Completo</option>
              <option value="Hoy">Hoy</option>
              <option value="Mañana">Mañana</option>
              <option value="Semana">Esta Semana</option>
              <option value="Mes">Este Mes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table / Listing */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reservas Filtradas ({filteredTurnos.length})</span>
          <span className="text-[9px] text-slate-400 font-bold md:hidden bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
            👈 Desliza horizontalmente para ver más
          </span>
        </div>

        {filteredTurnos.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-2">
            <Info className="w-8 h-8 text-slate-350" />
            <span className="font-semibold text-slate-700 text-xs">No se encontraron reservas cargadas</span>
            <p className="text-[10px] text-slate-400">Prueba ajustando los parámetros de búsqueda o los filtros superiores.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[850px] text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Fecha / Hora</th>
                  <th className="py-3 px-5">Cliente / Paciente</th>
                  <th className="py-3 px-5">Sede / Ubicación</th>
                  <th className="py-3 px-5">Práctica / Servicio</th>
                  <th className="py-3 px-5">Estado</th>
                  <th className="py-3 px-5">Pago Seña</th>
                  <th className="py-3 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {filteredTurnos.map((t) => {
                  const bState = getStatusBadge(t.estado_turno);
                  const formattedDate = format(parseISO(t.fecha), "dd/MM/yyyy");
                  
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-5 font-mono">
                        <span className="font-bold text-slate-800">{formattedDate}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-bold">{t.hora_inicio} hs</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-slate-800 block">{t.paciente.nombre} {t.paciente.apellido}</span>
                        <span className="text-[10px] text-slate-400 font-mono">DNI: {t.paciente.dni}</span>
                      </td>
                      <td className="py-3.5 px-5 font-medium truncate max-w-[150px]" title={t.consultorio}>
                        {t.consultorio}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-700">
                        {t.tipo_estudio}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${bState.bg}`}>
                          {bState.text}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {t.pago ? (
                          <div>
                            <span className="font-bold text-slate-800">${t.pago.monto_pagado}</span>
                            <span className={`text-[8px] font-bold block mt-0.5 uppercase tracking-wide
                              ${t.pago.estado_pago === "APROBADO" ? "text-emerald-600" : "text-amber-600"}`}>
                              {t.pago.estado_pago === "APROBADO" ? "Cobrado MP" : "Pendiente"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Sin cargo</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right flex items-center justify-end gap-1.5 mt-1.5">
                        {/* Action buttons */}
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(t)}
                          title="Ver Ficha Completa"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {t.estado_turno === "PRE_RESERVADO" && (
                          <button
                            type="button"
                            onClick={() => handleConfirm(t.id)}
                            title="Confirmar Reserva (Pago recibido)"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-700 cursor-pointer transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {(t.estado_turno === "CONFIRMADO" || t.estado_turno === "PRE_RESERVADO") && (
                          <button
                            type="button"
                            onClick={() => handleAttend(t.id)}
                            title="Marcar Asistido / Finalizado"
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-250 text-indigo-700 cursor-pointer transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {t.estado_turno !== "CANCELADO_PACIENTE" && t.estado_turno !== "CANCELADO_MEDICO" && (
                          <button
                            type="button"
                            onClick={() => handleCancel(t.id)}
                            title="Cancelar Reserva"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-700 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Side Panel / Modal Drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-slide-in-right">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 block">RESERVA ID: {selectedBooking.id}</span>
                  <h2 className="text-base font-bold text-slate-800 mt-1">Detalles de la Reserva</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="h-px bg-slate-100 my-4" />

              {/* Status Badge header */}
              <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-3.5 rounded-2xl mb-5">
                <span className="text-xs font-semibold text-slate-500">Estado Actual:</span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(selectedBooking.estado_turno).bg}`}>
                  {getStatusBadge(selectedBooking.estado_turno).text}
                </span>
              </div>

              {/* Patient data segment */}
              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Información del Cliente / Paciente</span>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col gap-2.5 mt-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-700 text-xs">{selectedBooking.paciente.nombre} {selectedBooking.paciente.apellido}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                      <span className="font-semibold text-slate-400 text-[10px] w-12">DNI:</span>
                      <span>{selectedBooking.paciente.dni}</span>
                    </div>
                    {selectedBooking.paciente.telefono && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <a href={`https://wa.me/${selectedBooking.paciente.telefono.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold hover:underline">
                          {selectedBooking.paciente.telefono}
                        </a>
                      </div>
                    )}
                    {selectedBooking.paciente.email && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedBooking.paciente.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-400 text-[10px] w-12">TIPO:</span>
                      <span className="font-bold text-slate-600">{selectedBooking.paciente.obra_social}</span>
                    </div>
                  </div>
                </div>

                {/* Sede and Práctica segment */}
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Detalles del Servicio</span>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col gap-2.5 mt-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-700 block">{selectedBooking.consultorio}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Ubicación física</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-700 block">{format(parseISO(selectedBooking.fecha), "dd/MM/yyyy")}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Horario asignado: {selectedBooking.hora_inicio} hs</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Eye className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-700 block">{selectedBooking.tipo_estudio}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Práctica / Servicio</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing and prepayments details */}
                {selectedBooking.pago && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Liquidación y Seña Contable</span>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col gap-2 mt-2 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span>Valor Total del Servicio:</span>
                        <span className="text-slate-800 font-bold">${selectedBooking.pago.monto_total}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Seña Recaudada MP:</span>
                        <span className="text-teal-600 font-bold">${selectedBooking.pago.monto_pagado}</span>
                      </div>
                      <div className="h-px bg-slate-200 my-1" />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Checkout Pref ID:</span>
                        <span className="font-mono">{selectedBooking.pago.checkout_id}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Estado del Pago:</span>
                        <span className="font-bold text-slate-700 uppercase">{selectedBooking.pago.estado_pago}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              {selectedBooking.estado_turno === "PRE_RESERVADO" && (
                <button
                  type="button"
                  onClick={() => {
                    handleConfirm(selectedBooking.id);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow transition-all text-center flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Confirmar Reserva
                </button>
              )}
              
              {(selectedBooking.estado_turno === "CONFIRMADO" || selectedBooking.estado_turno === "PRE_RESERVADO") && (
                <button
                  type="button"
                  onClick={() => {
                    handleAttend(selectedBooking.id);
                    setSelectedBooking(null);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow transition-all text-center flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  Marcar Atendido
                </button>
              )}

              {selectedBooking.estado_turno !== "CANCELADO_PACIENTE" && selectedBooking.estado_turno !== "CANCELADO_MEDICO" && (
                <button
                  type="button"
                  onClick={() => {
                    handleCancel(selectedBooking.id);
                    setSelectedBooking(null);
                  }}
                  className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold p-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center"
                  title="Cancelar Reserva"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
