"use client";

import { useState, useEffect } from "react";
import { mockDB, MockTurno } from "@/lib/mockData";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Building2, 
  AlertCircle, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Info,
  QrCode,
  User
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface MisTurnosViewProps {
  currentPatient: {
    dni: string;
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
    obraSocial: string;
  } | null;
  onGoToBooking: () => void;
}

export default function MisTurnosView({ currentPatient, onGoToBooking }: MisTurnosViewProps) {
  const [myTurnos, setMyTurnos] = useState<MockTurno[]>([]);
  const [payingTurnoId, setPayingTurnoId] = useState<string | null>(null);
  const [selectedTurnoForQr, setSelectedTurnoForQr] = useState<MockTurno | null>(null);

  const loadMyTurnos = () => {
    if (!currentPatient) {
      setMyTurnos([]);
      return;
    }
    const all = mockDB.getTurnos();
    // Filter matching by DNI or Email
    const filtered = all.filter(t => 
      t.paciente.dni === currentPatient.dni || 
      t.paciente.email.toLowerCase() === currentPatient.email.toLowerCase()
    );
    // Sort chronologically (future appointments first or simple reverse ID sorting)
    filtered.sort((a, b) => b.id.localeCompare(a.id));
    setMyTurnos(filtered);
  };

  useEffect(() => {
    loadMyTurnos();
  }, [currentPatient]);

  const handleSimulatePayment = (turnoId: string) => {
    setPayingTurnoId(turnoId);
    setTimeout(() => {
      const all = mockDB.getTurnos();
      const idx = all.findIndex(t => t.id === turnoId);
      if (idx !== -1) {
        all[idx].estado_turno = "CONFIRMADO";
        if (all[idx].pago) {
          all[idx].pago!.estado_pago = "APROBADO";
          all[idx].pago!.monto_pagado = all[idx].pago!.monto_total / 2; // seña paid
        }
        mockDB.saveTurnos(all);

        // Outgoing notifications logs (Fase 7 Extra)
        const currentLogs = localStorage.getItem("zuma_outgoing_notifications_log");
        const logsList = currentLogs ? JSON.parse(currentLogs) : [];
        const t = all[idx];
        const patientName = `${t.paciente.nombre} ${t.paciente.apellido}`;
        
        logsList.unshift({
          id: `log_mp_wh_${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          channel: "WhatsApp",
          recipient: t.paciente.telefono,
          message: `¡Hola ${t.paciente.nombre}! Mercado Pago acreditó tu seña de $${t.pago?.monto_pagado?.toLocaleString("es-AR")} ARS. Tu código QR de ingreso ha sido activado: https://zuma-crm.vercel.app/qr/${t.id}`,
          status: "ENVIADO"
        });

        logsList.unshift({
          id: `log_mp_em_${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          channel: "Email",
          recipient: t.paciente.email,
          message: `Hola ${patientName}, confirmamos la aprobación de tu pago de seña. Tu reserva para el ${t.fecha} a las ${t.hora_inicio || t.hora || "09:00"} hs en ${t.partnerName || "ZUMA"} ya se encuentra CONFIRMADA.`,
          status: "ENTREGADO"
        });

        localStorage.setItem("zuma_outgoing_notifications_log", JSON.stringify(logsList));
      }
      setPayingTurnoId(null);
      loadMyTurnos();
    }, 1200);
  };

  const handleCancelTurno = (turnoId: string) => {
    if (confirm("¿Estás seguro de que deseas cancelar este turno?")) {
      mockDB.updateTurnoStatus(turnoId, "CANCELADO_PACIENTE");
      loadMyTurnos();
    }
  };

  const getStatusLabel = (t: MockTurno) => {
    if (t.estado_turno === "CONFIRMADO") return { text: "Confirmado", bg: "bg-emerald-50 border-emerald-200 text-emerald-700" };
    if (t.estado_turno === "ATENDIDO") return { text: "Atendido", bg: "bg-teal-50 border-teal-200 text-teal-700" };
    if (t.estado_turno === "PRE_RESERVADO") return { text: "Seña Pendiente", bg: "bg-amber-50 border-amber-200 text-amber-700 animate-pulse" };
    return { text: "Cancelado", bg: "bg-slate-50 border-slate-200 text-slate-400" };
  };

  // If Guest (no patient profile)
  if (!currentPatient) {
    return (
      <div className="max-w-md mx-auto bg-white border border-slate-200 p-8 rounded-2xl shadow-sm text-center flex flex-col items-center gap-4 animate-slide-in mt-6">
        <CalendarIcon className="w-14 h-14 text-slate-300 stroke-[1.2]" />
        <h3 className="font-semibold text-slate-700 text-sm">Mis Reservas</h3>
        <p className="text-xs text-slate-400 leading-normal">
          Para ver tus turnos agendados o realizar pagos de señas debes iniciar una reserva e identificarte con tus datos.
        </p>
        <button
          onClick={onGoToBooking}
          className="w-full bg-primary hover:bg-teal-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer mt-2"
        >
          Iniciar Nueva Reserva
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-slide-in">
      
      {/* Header details */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Historial de Paciente</span>
          <h3 className="font-bold text-slate-800 text-sm leading-snug">{currentPatient.nombre} {currentPatient.apellido}</h3>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">DNI: {currentPatient.dni} &bull; {currentPatient.obraSocial}</p>
        </div>
        <button
          onClick={onGoToBooking}
          className="bg-primary hover:bg-teal-600 text-white font-bold py-2 px-3.5 rounded-lg text-xs shadow transition-all cursor-pointer"
        >
          Reservar Otro
        </button>
      </div>

      <h2 className="text-sm font-semibold text-slate-700 -mb-2">Tus Reservas Solicitadas</h2>

      {myTurnos.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center rounded-2xl flex flex-col items-center gap-3">
          <Info className="w-10 h-10 text-slate-300" />
          <p className="text-xs text-slate-400">No tienes reservas solicitadas en este momento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {myTurnos.map((t) => {
            const badge = getStatusLabel(t);
            const isPendingPayment = t.estado_turno === "PRE_RESERVADO";
            
            return (
              <div 
                key={t.id} 
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4"
              >
                {/* Time and study details */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-teal-600">{t.hora_inicio} hs</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${badge.bg}`}>
                        {badge.text}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-800 text-xs mt-1">
                      {t.tipo_estudio}
                    </h4>
                    {t.partnerName && (
                      <p className="text-[9px] font-bold text-indigo-600 mt-0.5 uppercase tracking-wide">
                        {t.partnerName}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {t.consultorio}
                    </p>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-0.5">
                    <span className="text-[10px] text-slate-400 font-mono">ID: {t.id}</span>
                    <span className="text-xs font-bold text-slate-800">${t.pago?.monto_total.toLocaleString("es-AR")}</span>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Subsections: payment / actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-[10px] text-slate-400">
                    Reserva: <span className="font-semibold text-slate-600">{format(new Date(t.creado_el), "dd/MM/yyyy")}</span>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {/* Simular MP pay option */}
                    {isPendingPayment && (
                      <button
                        onClick={() => handleSimulatePayment(t.id)}
                        disabled={payingTurnoId === t.id}
                        className="flex-1 sm:flex-none bg-[#009EE3] hover:bg-[#008cc9] text-white font-bold py-1.5 px-3 rounded-lg text-[10px] shadow flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {payingTurnoId === t.id ? "Abonando..." : "Pagar Seña MP"}
                      </button>
                    )}

                    {(t.estado_turno === "CONFIRMADO" || t.estado_turno === "PRE_RESERVADO") && (
                      <>
                        <button
                          onClick={() => setSelectedTurnoForQr(t)}
                          className="flex-1 sm:flex-none py-1.5 px-3 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 transition-colors text-[10px] font-semibold cursor-pointer flex items-center justify-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5 text-indigo-650" />
                          Ver QR
                        </button>
                        <button
                          onClick={() => handleCancelTurno(t.id)}
                          className="flex-1 sm:flex-none py-1.5 px-3 rounded-lg border border-slate-250 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors text-[10px] font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stylistic Access QR Code Overlay Card Drawer */}
      {selectedTurnoForQr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-150 flex flex-col gap-4 w-full max-w-sm relative animate-scale-in">
            <button
              type="button"
              onClick={() => setSelectedTurnoForQr(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="text-center flex flex-col items-center gap-1.5 pb-2 border-b border-slate-100">
              <QrCode className="w-8 h-8 text-indigo-650 animate-pulse" />
              <h3 className="font-extrabold text-slate-800 text-sm">Ficha Digital y Acceso QR</h3>
              <p className="text-[10px] text-slate-400">Código de Turno: <span className="font-mono font-bold text-slate-650">{selectedTurnoForQr.id}</span></p>
            </div>

            {/* Stylistic mock QR SVG code */}
            <div className="relative mx-auto border border-slate-200 p-3 rounded-2xl bg-white shadow-sm overflow-hidden">
              <svg width="140" height="140" viewBox="0 0 100 100" className="mx-auto">
                <path d="M0 0h30v30H0zm0 70h30v30H0zm70-70h30v30H70z" fill="#0f172a" />
                <path d="M5 5h20v20H5zm0 70h20v20H5zm70-70h20v20H75z" fill="#ffffff" />
                <path d="M10 10h10v10H10zm0 70h10v10H10zm70-70h10v10H70z" fill="#312e81" />
                
                <path d="M35 10h5v5h-5zm10 0h10v5H45zm15 0h5v5h-5zm0 10h10v5h-10zm-15 10h5v5h-5zm-10 10h15v5H35zm25 5h5v15h-5zm-25 10h10v5H35zm15 5h5v5h-5zm15 0h10v5h-10zm-30 10h5v5h-5zm15 5h15v5H50zm15 10h10v5h-10zm10 5h5v5h-5z" fill="#0c0a09" />
                <path d="M35 35h5v5h-5zm15 0h5v5h-5zm15 5h5v5h-5zm-25 15h10v5h-10zm15 5h5v5h-5zm10 10h10v5h-10zm-20 10h5v5h-5z" fill="#4f46e5" />
              </svg>
              {/* Scanline laser indicator */}
              <div className="absolute left-0 right-0 h-0.5 bg-rose-500 shadow shadow-rose-400 top-0 animate-scan pointer-events-none" />
            </div>

            {/* Turn details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Comercio:</span>
                <span className="font-bold text-slate-800">{selectedTurnoForQr.partnerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Servicio:</span>
                <span className="font-bold text-slate-805">{selectedTurnoForQr.tipo_estudio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Fecha y Hora:</span>
                <span className="font-bold text-teal-600">{selectedTurnoForQr.fecha} a las {selectedTurnoForQr.hora_inicio} hs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Ubicación:</span>
                <span className="font-bold text-slate-800">{selectedTurnoForQr.consultorio}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 mt-1">
                <span className="text-slate-400 font-semibold">Monto Total:</span>
                <span className="font-extrabold text-slate-800 text-sm">${selectedTurnoForQr.pago?.monto_total.toLocaleString("es-AR")}</span>
              </div>
            </div>

            {/* Condition Banner */}
            {selectedTurnoForQr.estado_turno === "PRE_RESERVADO" ? (
              <div className="flex flex-col gap-3">
                <div className="p-3.5 bg-amber-50 border border-amber-250/65 rounded-xl text-[10px] text-amber-800 leading-normal flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Seña Pendiente (${selectedTurnoForQr.pago?.monto_pagado.toLocaleString("es-AR")} ARS)</span>
                    El código QR estará inhabilitado para el ingreso hasta registrar el pago de la seña.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleSimulatePayment(selectedTurnoForQr.id);
                    setSelectedTurnoForQr(null);
                  }}
                  className="w-full bg-[#009EE3] hover:bg-[#008cc9] text-white font-bold py-2.5 rounded-xl text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  Pagar Seña con Mercado Pago
                </button>
              </div>
            ) : selectedTurnoForQr.estado_turno === "CONFIRMADO" ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-250/65 rounded-xl text-[10px] text-emerald-800 leading-normal flex items-start gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Ingreso QR Habilitado</span>
                  Presenta esta ficha digital en recepción para validar tu asistencia al comercio.
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-[10px] text-slate-650 leading-normal flex items-start gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Check-in Realizado</span>
                  Tu ingreso ya fue registrado y validado en este comercio.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
