"use client";

import { useState } from "react";
import { X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualBookingModal({ isOpen, onClose, onSuccess }: ManualBookingModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fecha: format(new Date(), "yyyy-MM-dd"),
    hora: "09:00",
    tipoEstudio: "Consulta general",
    consultorio: "Sanatorio Central Banda",
    dni: "",
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    obraSocial: "Particular",
    pagaEnConsultorio: true // Default true for secretary manual bookings
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/turnos/pre-reservar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: formData.fecha,
          hora_inicio: formData.hora,
          tipo_estudio: formData.tipoEstudio,
          consultorio: formData.consultorio,
          paciente: {
            dni: formData.dni,
            nombre: formData.nombre,
            apellido: formData.apellido,
            telefono: formData.telefono,
            email: formData.email,
            obra_social: formData.obraSocial
          },
          via_reserva: "SECRETARIA",
          paga_en_consultorio: formData.pagaEnConsultorio
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear el turno.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Generate simple candidate times every 30 minutes from 08:00 to 18:00
  const timeOptions: string[] = [];
  let currentHour = 8;
  let currentMin = 0;
  while (currentHour < 19) {
    const hourStr = currentHour.toString().padStart(2, "0");
    const minStr = currentMin.toString().padStart(2, "0");
    timeOptions.push(`${hourStr}:${minStr}`);
    currentMin += 15;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour += 1;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-100 flex flex-col animate-slide-in">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display font-semibold text-slate-800 text-lg">Cargar Turno Manual</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 flex-1 overflow-y-auto max-h-[75vh] flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fecha</label>
              <input
                type="date"
                name="fecha"
                required
                value={formData.fecha}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Hora de inicio</label>
              <select
                name="hora"
                value={formData.hora}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
              >
                {timeOptions.map(t => (
                  <option key={t} value={t}>{t} hs</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Estudio / Práctica</label>
              <select
                name="tipoEstudio"
                value={formData.tipoEstudio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
              >
                <option value="Consulta general">Consulta General</option>
                <option value="Electrocardiograma">Electrocardiograma (ECG)</option>
                <option value="Ergometría">Ergometría (Prueba de Esfuerzo)</option>
                <option value="Ecocardiograma">Ecocardiograma</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Lugar de Atención</label>
              <select
                name="consultorio"
                value={formData.consultorio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
              >
                <option value="Sanatorio Central Banda">Sanatorio Central Banda</option>
                <option value="Clínica Del Pilar">Clínica Del Pilar</option>
                <option value="Centro Médico Cannon">Centro Médico Cannon</option>
              </select>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-1" />

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nombre</label>
              <input
                type="text"
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Juan"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Apellido</label>
              <input
                type="text"
                name="apellido"
                required
                value={formData.apellido}
                onChange={handleInputChange}
                placeholder="Pérez"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">DNI</label>
              <input
                type="text"
                name="dni"
                required
                value={formData.dni}
                onChange={handleInputChange}
                placeholder="DNI del paciente"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Teléfono (WhatsApp)</label>
              <input
                type="tel"
                name="telefono"
                required
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="+54911..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@example.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Obra Social / Prepaga</label>
              <select
                name="obraSocial"
                value={formData.obraSocial}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
              >
                <option value="Particular">Particular (Sin Obra Social)</option>
                <option value="OSDE">OSDE</option>
                <option value="Swiss Medical">Swiss Medical</option>
                <option value="Galeno">Galeno</option>
                <option value="PAMI">PAMI</option>
                <option value="OSECAC">OSECAC</option>
              </select>
            </div>
          </div>

          {/* Payment Override checkbox */}
          <div className="bg-teal-50 border border-teal-200/50 p-4 rounded-xl flex items-start gap-2.5 mt-2">
            <input
              type="checkbox"
              id="pagaEnConsultorio"
              name="pagaEnConsultorio"
              checked={formData.pagaEnConsultorio}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 accent-teal-600"
            />
            <div className="flex-1">
              <label htmlFor="pagaEnConsultorio" className="text-xs font-bold text-teal-800 cursor-pointer">
                Confirmar Directamente (Paga en consultorio)
              </label>
              <p className="text-[10px] text-teal-600 mt-0.5 leading-relaxed">
                Omite el temporizador de 15 minutos y la pasarela de Mercado Pago. El turno ingresará en estado <strong>CONFIRMADO</strong>.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit buttons */}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-teal-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-md shadow-teal-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Agendar Turno
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
