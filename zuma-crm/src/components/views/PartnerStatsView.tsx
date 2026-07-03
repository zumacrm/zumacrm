"use client";

import { useState, useEffect } from "react";
import { mockDB, MockTurno, Partner } from "@/lib/mockData";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Smartphone, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Clock 
} from "lucide-react";

interface PartnerStatsViewProps {
  partnerId?: string;
}

export default function PartnerStatsView({ partnerId = "dr-carlos-jensen" }: PartnerStatsViewProps) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [turnos, setTurnos] = useState<MockTurno[]>([]);

  useEffect(() => {
    const p = mockDB.getPartners().find(item => item.id === partnerId);
    if (p) setPartner(p);

    const list = mockDB.getTurnos();
    // Filter turnos belonging to this partner
    // Backward compatibility: if no partnerId in turno, check if the location belongs to the partner's locations
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
    setTurnos(filtered);
  }, [partnerId]);

  // Calculations
  const totalBookings = turnos.length;
  const confirmedBookings = turnos.filter(t => t.estado_turno === "CONFIRMADO").length;
  const preReservados = turnos.filter(t => t.estado_turno === "PRE_RESERVADO").length;
  const attendedBookings = turnos.filter(t => t.estado_turno === "ATENDIDO").length;
  
  const canceledByPatient = turnos.filter(t => t.estado_turno === "CANCELADO_PACIENTE").length;
  const canceledByPartner = turnos.filter(t => t.estado_turno === "CANCELADO_MEDICO").length;
  const totalCanceled = canceledByPatient + canceledByPartner;

  // Show Rate Calculation: Attended / (Attended + No-shows/Canceled)
  const activeAndResolved = attendedBookings + totalCanceled;
  const showRate = activeAndResolved > 0 ? Math.round((attendedBookings / activeAndResolved) * 100) : 85;
  const cancelRate = 100 - showRate;

  // Financial calculations
  const totalRevenue = turnos
    .filter(t => t.estado_turno === "CONFIRMADO" || t.estado_turno === "ATENDIDO" || t.estado_turno === "PRE_RESERVADO")
    .reduce((sum, t) => sum + (t.pago?.monto_total || 0), 0);

  const prepaidCollected = turnos
    .filter(t => t.estado_turno === "CONFIRMADO" || t.estado_turno === "ATENDIDO" || t.estado_turno === "PRE_RESERVADO")
    .reduce((sum, t) => sum + (t.pago?.monto_pagado || 0), 0);

  const averageTicket = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

  // Channel breakdown
  const webBookings = turnos.filter(t => t.via_reserva === "WEB_PACIENTE").length;
  const manualBookings = turnos.filter(t => t.via_reserva === "SECRETARIA").length;
  const webPercentage = totalBookings > 0 ? Math.round((webBookings / totalBookings) * 100) : 60;
  const manualPercentage = 100 - webPercentage;

  // Location Ranking
  const locationStats: { [name: string]: number } = {};
  turnos.forEach(t => {
    locationStats[t.consultorio] = (locationStats[t.consultorio] || 0) + 1;
  });
  const sortedLocations = Object.entries(locationStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Service Breakdown
  const serviceStats: { [name: string]: number } = {};
  turnos.forEach(t => {
    serviceStats[t.tipo_estudio] = (serviceStats[t.tipo_estudio] || 0) + 1;
  });
  const sortedServices = Object.entries(serviceStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Estadísticas y Analítica</h1>
        <p className="text-xs text-slate-400 mt-1">
          Panel de métricas contables, comportamiento de reservas y efectividad para <span className="font-bold text-slate-600">{partner?.name || "Dr. Carlos Jensen"}</span>.
        </p>
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reservas Recibidas</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{totalBookings}</span>
            <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> +12% este mes
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facturación Estimada</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">${totalRevenue.toLocaleString("es-AR")}</span>
            <span className="text-[9px] text-slate-400 font-semibold mt-1 block">Abonados por consulta/servicio</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Prepaid collected via Mercado Pago */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Señas Recaudadas</span>
            <span className="text-2xl font-black text-teal-600 mt-1 block">${prepaidCollected.toLocaleString("es-AR")}</span>
            <span className="text-[9px] text-slate-400 font-semibold mt-1 block">Garantizados vía Mercado Pago</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Show Rate */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tasa de Asistencia</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{showRate}%</span>
            <span className="text-[9px] text-slate-400 font-semibold mt-1 block">No-shows/cancelaciones: {cancelRate}%</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Stats breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking state breakdown and Channel */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm lg:col-span-2 flex flex-col gap-6">
          <div>
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Estado de las Reservas</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Distribución general de reservas históricas del socio.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Asistidos</span>
              <span className="text-xl font-bold text-slate-700 mt-0.5 block">{attendedBookings}</span>
            </div>
            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
              <span className="text-[9px] font-bold text-emerald-600 uppercase">Confirmados</span>
              <span className="text-xl font-bold text-emerald-700 mt-0.5 block">{confirmedBookings}</span>
            </div>
            <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
              <span className="text-[9px] font-bold text-amber-600 uppercase">Pendientes Seña</span>
              <span className="text-xl font-bold text-amber-700 mt-0.5 block">{preReservados}</span>
            </div>
            <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl">
              <span className="text-[9px] font-bold text-red-600 uppercase">Cancelados</span>
              <span className="text-xl font-bold text-red-700 mt-0.5 block">{totalCanceled}</span>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Booking Channel percentage */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Canal de Adquisición</span>
              <span className="text-slate-400 font-medium">Autoservicio Web ({webPercentage}%) vs. Agenda Manual ({manualPercentage}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${webPercentage}%` }} className="bg-indigo-600 h-full" title="Web Pacientes" />
              <div style={{ width: `${manualPercentage}%` }} className="bg-slate-350 h-full" title="Secretaría Manual" />
            </div>
            <div className="flex gap-4 text-[9px] font-semibold text-slate-500 mt-1">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                <span>Web Pública ({webBookings} reservas)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-slate-350 rounded-full" />
                <span>Ingresados por Secretaría ({manualBookings} reservas)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location Ranking Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Ranking de Sedes</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Las ubicaciones físicas que concentran más volumen.</p>
          </div>

          {sortedLocations.length === 0 ? (
            <div className="text-center py-6 text-[10px] text-slate-400 italic">No hay datos de sedes registrados</div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedLocations.map(([name, count], index) => {
                const percentage = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
                return (
                  <div key={name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1 truncate max-w-[70%]">
                        <span className="text-[10px] text-slate-400 font-mono">#{index + 1}</span>
                        {name}
                      </span>
                      <span className="font-bold text-slate-500 text-[10px]">{count} res. ({percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div style={{ width: `${percentage}%` }} className="bg-teal-500 h-full" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="h-px bg-slate-100 my-1" />

          {/* Ticket promedio */}
          <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Ticket Promedio</span>
                <span className="text-[10px] text-slate-500 font-semibold">Valor medio por reserva</span>
              </div>
            </div>
            <span className="font-black text-slate-700 text-sm">${averageTicket.toLocaleString("es-AR")}</span>
          </div>
        </div>
      </div>

      {/* Services Breakdown Row */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Prácticas y Servicios más Demandados</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Análisis del tipo de actividad o especialidad contratada.</p>
        </div>

        {sortedServices.length === 0 ? (
          <div className="text-center py-6 text-[10px] text-slate-400 italic">No hay reservas registradas</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedServices.map(([name, count]) => {
              const percentage = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
              return (
                <div key={name} className="p-4 border border-slate-150 rounded-xl flex flex-col justify-between gap-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-700 text-xs leading-tight truncate-2-lines">{name}</span>
                    <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                      {percentage}%
                    </span>
                  </div>
                  <div>
                    <span className="text-lg font-black text-slate-800 block">{count}</span>
                    <span className="text-[9px] text-slate-400 font-semibold block">Reservas confirmadas</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
