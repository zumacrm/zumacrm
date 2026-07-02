"use client";

import { useState } from "react";
import { format, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Search, 
  Calendar as CalendarIcon, 
  Clock, 
  CreditCard, 
  XCircle, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Stethoscope,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";

export default function MisTurnosPage() {
  const [dniInput, setDniInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [paciente, setPaciente] = useState<any | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dniInput) return;

    setLoading(true);
    setSearched(false);
    setTurnos([]);
    setPaciente(null);

    try {
      const res = await fetch(`/api/turnos/paciente?dni=${encodeURIComponent(dniInput)}`);
      const data = await res.json();
      if (data.success) {
        setTurnos(data.turnos);
        setPaciente(data.paciente);
        setSearched(true);
      }
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al buscar los turnos.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTurno = async (turnoId: string) => {
    if (!confirm("¿Seguro que deseas cancelar este turno? Perderás la seña abonada si estás cancelando fuera de término.")) return;
    setCancelingId(turnoId);

    try {
      const res = await fetch("/api/admin/turnos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnoId, estado: "CANCELADO_PACIENTE" })
      });
      const data = await res.json();
      
      if (data.success) {
        // Refresh
        const updatedRes = await fetch(`/api/turnos/paciente?dni=${encodeURIComponent(dniInput)}`);
        const updatedData = await updatedRes.json();
        if (updatedData.success) {
          setTurnos(updatedData.turnos);
        }
      } else {
        alert("Error al cancelar: " + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCancelingId(null);
    }
  };

  const checkCanCancel = (turno: any) => {
    if (turno.estado_turno !== "CONFIRMADO" && turno.estado_turno !== "PRE_RESERVADO") return false;
    
    // Parse turno date and time
    const [hours, minutes] = turno.hora_inicio.split(":");
    const appointmentDate = new Date(turno.fecha);
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const hoursDiff = differenceInHours(appointmentDate, new Date());
    return hoursDiff >= 24;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRE_RESERVADO":
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">Pre-reservado (Impago)</span>;
      case "CONFIRMADO":
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">Confirmado</span>;
      case "ATENDIDO":
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">Atendido</span>;
      case "CANCELADO_PACIENTE":
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">Cancelado por Paciente</span>;
      case "CANCELADO_MEDICO":
        return <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">Cancelado por Médico (Reembolsado)</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center">
                <Stethoscope className="w-4.5 h-4.5" />
              </div>
              <span className="font-display font-bold text-slate-800 text-sm">Consultorio Dr. Carlos Jensen</span>
            </div>
          </div>
          <Link href="/reservar" className="text-xs font-bold text-primary hover:underline">
            Pedir Turno &rarr;
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">Mis Turnos Médicos</h2>
          <p className="text-slate-500 text-xs mt-1">Busca tu historial de reservas y gestiona citas activas ingresando tu DNI.</p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="glass-card p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={dniInput}
              onChange={(e) => setDniInput(e.target.value)}
              placeholder="Ingresa tu DNI (ej. 35123456)"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-teal-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-md shadow-teal-500/10 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
          </button>
        </form>

        {/* Results List */}
        {searched && (
          <div className="flex flex-col gap-4">
            {paciente && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-500 shadow-sm">
                Paciente: <strong className="text-slate-800">{paciente.nombre} {paciente.apellido}</strong> • Email: <strong className="text-slate-800">{paciente.email}</strong>
              </div>
            )}

            {turnos.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-2 text-slate-400 shadow-sm">
                <CalendarIcon className="w-10 h-10 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No se encontraron turnos</p>
                <p className="text-xs">No posees turnos registrados para el DNI ingresado.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {turnos.map((t) => {
                  const canCancel = checkCanCancel(t);
                  
                  // Checkout link for pre-reserved
                  const checkoutUrl = t.pago ? `/pago/simular?checkoutId=${t.pago.checkout_id}&turnoId=${t.id}` : null;
                  
                  return (
                    <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-in">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(t.estado_turno)}
                          <span className="text-[10px] font-semibold text-slate-400">Ref: #{t.id.substring(0, 8)}</span>
                        </div>
                        <h4 className="font-semibold text-slate-800 text-sm">{t.tipo_estudio}</h4>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                            {format(new Date(t.fecha + "T00:00:00"), "dd/MM/yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {t.hora_inicio} hs
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 w-full md:w-auto self-end md:self-center">
                        {t.estado_turno === "PRE_RESERVADO" && checkoutUrl && (
                          <Link
                            href={checkoutUrl}
                            className="flex-1 md:flex-initial text-center bg-[#009EE3] hover:bg-[#0089c7] text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow"
                          >
                            <CreditCard className="w-4.5 h-4.5" />
                            Pagar Seña
                          </Link>
                        )}
                        
                        {canCancel ? (
                          <button
                            onClick={() => handleCancelTurno(t.id)}
                            disabled={cancelingId !== null}
                            className="flex-1 md:flex-initial text-center bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {cancelingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4.5 h-4.5" />}
                            Cancelar Turno
                          </button>
                        ) : (
                          (t.estado_turno === "CONFIRMADO" || t.estado_turno === "PRE_RESERVADO") && (
                            <div className="flex-1 md:flex-initial p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-1.5 text-[10px] text-rose-700 leading-normal max-w-[250px]">
                              <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                              <span>Cita en menos de 24 hs. El botón de cancelación se ha bloqueado y la seña del 50% es retenida.</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
