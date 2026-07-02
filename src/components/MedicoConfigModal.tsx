"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, AlertCircle, CheckCircle, Clock, CheckSquare, Square } from "lucide-react";

interface MedicoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CLINICAS = [
  "Sanatorio Central Banda",
  "Clínica Del Pilar",
  "Centro Médico Cannon"
];

const WEEKDAYS = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" }
];

const ESTUDIOS_LIST = [
  { id: "Consulta general", label: "Consulta General" },
  { id: "Electrocardiograma", label: "Electrocardiograma (ECG)" },
  { id: "Ergometría", label: "Ergometría" },
  { id: "Ecocardiograma", label: "Ecocardiograma" }
];

export default function MedicoConfigModal({ isOpen, onClose, onSuccess }: MedicoConfigModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const [nombre, setNombre] = useState<string>("Dr. Carlos Jensen");
  const [especialidad, setEspecialidad] = useState<string>("");
  const [valorConsulta, setValorConsulta] = useState<number>(30000);
  const [porcentajeSenia, setPorcentajeSenia] = useState<number>(50);
  
  // Schedule state by Location, containing weekly days and enabled studies list
  const [schedules, setSchedules] = useState<any>({});

  // Initialize empty state helper
  const getEmptyScheduleState = () => {
    const state: any = {};
    CLINICAS.forEach(c => {
      state[c] = {
        days: {},
        estudiosDisponibles: ["Consulta general"] // Default list
      };
      WEEKDAYS.forEach(d => {
        state[c].days[d.id] = {
          enabled: false,
          morningStart: "09:00",
          morningEnd: "13:00",
          afternoonEnabled: false,
          afternoonStart: "14:00",
          afternoonEnd: "18:00"
        };
      });
    });
    return state;
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const res = await fetch("/api/medico/config");
        const data = await res.json();

        if (data.success && data.config) {
          const cfg = data.config;
          setNombre(cfg.nombre);
          setEspecialidad(cfg.especialidad);
          setValorConsulta(Number(cfg.valor_consulta));
          setPorcentajeSenia(cfg.porcentaje_senia);

          // Build local state from database JSONB
          const dbSchedule = cfg.horario_atencion || {};
          const localState = getEmptyScheduleState();

          CLINICAS.forEach(clinic => {
            const clinicDb = dbSchedule[clinic] || {};
            
            // Map studies
            if (Array.isArray(clinicDb.estudios_disponibles)) {
              localState[clinic].estudiosDisponibles = clinicDb.estudios_disponibles;
            }

            // Map days
            WEEKDAYS.forEach(day => {
              const dayRanges = clinicDb[day.id] || [];
              if (dayRanges.length > 0) {
                localState[clinic].days[day.id].enabled = true;
                localState[clinic].days[day.id].morningStart = dayRanges[0].inicio;
                localState[clinic].days[day.id].morningEnd = dayRanges[0].fin;

                if (dayRanges.length > 1) {
                  localState[clinic].days[day.id].afternoonEnabled = true;
                  localState[clinic].days[day.id].afternoonStart = dayRanges[1].inicio;
                  localState[clinic].days[day.id].afternoonEnd = dayRanges[1].fin;
                }
              }
            });
          });

          setSchedules(localState);
        } else {
          setSchedules(getEmptyScheduleState());
        }
      } catch (err) {
        console.error("Error loading config:", err);
        setError("Error de red al cargar la configuración.");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [isOpen]);

  const handleCheckboxChange = (clinic: string, day: string, field: "enabled" | "afternoonEnabled", checked: boolean) => {
    setSchedules((prev: any) => {
      const next = { ...prev };
      next[clinic].days[day][field] = checked;
      return next;
    });
  };

  const handleTimeChange = (clinic: string, day: string, field: string, value: string) => {
    setSchedules((prev: any) => {
      const next = { ...prev };
      next[clinic].days[day][field] = value;
      return next;
    });
  };

  const handleStudyCheckboxChange = (clinic: string, studyId: string, checked: boolean) => {
    setSchedules((prev: any) => {
      const next = { ...prev };
      let list = next[clinic].estudiosDisponibles || [];
      if (checked) {
        if (!list.includes(studyId)) {
          list = [...list, studyId];
        }
      } else {
        list = list.filter((s: string) => s !== studyId);
      }
      next[clinic].estudiosDisponibles = list;
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Compile local schedules state to Database JSON format
    const dbSchedule: any = {};

    CLINICAS.forEach(clinic => {
      dbSchedule[clinic] = {
        estudios_disponibles: schedules[clinic]?.estudiosDisponibles || ["Consulta general"]
      };
      
      WEEKDAYS.forEach(day => {
        const dayState = schedules[clinic]?.days?.[day.id];
        if (dayState && dayState.enabled) {
          const ranges = [
            { inicio: dayState.morningStart, fin: dayState.morningEnd }
          ];

          if (dayState.afternoonEnabled) {
            ranges.push({ inicio: dayState.afternoonStart, fin: dayState.afternoonEnd });
          }

          dbSchedule[clinic][day.id] = ranges;
        }
      });
    });

    try {
      const res = await fetch("/api/medico/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          especialidad,
          valor_consulta: valorConsulta,
          porcentaje_senia: porcentajeSenia,
          horario_atencion: dbSchedule
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al guardar configuración.");
      }

      setSuccess(true);
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-slide-in">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-lg">Configuración de Agenda, Estudios y Valores</h3>
            <p className="text-xs text-slate-400">Modifica los horarios, prácticas permitidas y el costo base de la consulta médica.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-semibold">Cargando configuración...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            
            {/* General parameters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nombre Médico</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Valor Consulta ($)</label>
                <input
                  type="number"
                  required
                  value={valorConsulta}
                  onChange={(e) => setValorConsulta(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Porcentaje Seña (%)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={porcentajeSenia}
                  onChange={(e) => setPorcentajeSenia(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Specialties Field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Especialidades</label>
              <input
                type="text"
                required
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                placeholder="ej. Cardiología clínica | Cardio metabolismo"
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-primary"
              />
            </div>

            {/* Schedule config grouped by clinic */}
            <div className="flex flex-col gap-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cronogramas y Prácticas por Clínica</h4>
              
              {CLINICAS.map((clinic) => {
                const clinicState = schedules[clinic] || {
                  days: {},
                  estudiosDisponibles: []
                };

                return (
                  <div key={clinic} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-4 bg-white shadow-sm">
                    <div className="pb-2 border-b border-slate-100">
                      <span className="font-semibold text-slate-800 text-sm">{clinic}</span>
                    </div>

                    {/* Checkboxes for available studies at this location */}
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 flex flex-col gap-2">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estudios / Prácticas Habilitadas</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {ESTUDIOS_LIST.map((est) => {
                          const isEnabled = clinicState.estudiosDisponibles?.includes(est.id);
                          return (
                            <label key={est.id} className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer hover:text-slate-800">
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => handleStudyCheckboxChange(clinic, est.id, e.target.checked)}
                                className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 accent-teal-600 cursor-pointer"
                              />
                              <span>{est.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3.5">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Días y Horas de Atención</span>
                      
                      {WEEKDAYS.map((day) => {
                        const dayState = clinicState.days?.[day.id] || {
                          enabled: false,
                          morningStart: "09:00",
                          morningEnd: "13:00",
                          afternoonEnabled: false,
                          afternoonStart: "14:00",
                          afternoonEnd: "18:00"
                        };

                        return (
                          <div key={day.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                            {/* Day checkbox */}
                            <div className="flex items-center gap-2 md:w-32">
                              <input
                                type="checkbox"
                                id={`check-${clinic}-${day.id}`}
                                checked={dayState.enabled}
                                onChange={(e) => handleCheckboxChange(clinic, day.id, "enabled", e.target.checked)}
                                className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 accent-teal-600 cursor-pointer"
                              />
                              <label htmlFor={`check-${clinic}-${day.id}`} className="font-semibold text-slate-700 cursor-pointer">
                                {day.label}
                              </label>
                            </div>

                            {dayState.enabled && (
                              <div className="flex flex-1 flex-col md:flex-row gap-4 items-start md:items-center">
                                {/* Morning range */}
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-[10px] text-slate-400">Mañana:</span>
                                  <input
                                    type="text"
                                    value={dayState.morningStart}
                                    onChange={(e) => handleTimeChange(clinic, day.id, "morningStart", e.target.value)}
                                    placeholder="09:00"
                                    className="w-14 px-1.5 py-1 text-center rounded border border-slate-200 text-xs font-semibold focus:outline-none"
                                  />
                                  <span className="text-slate-400">&mdash;</span>
                                  <input
                                    type="text"
                                    value={dayState.morningEnd}
                                    onChange={(e) => handleTimeChange(clinic, day.id, "morningEnd", e.target.value)}
                                    placeholder="13:00"
                                    className="w-14 px-1.5 py-1 text-center rounded border border-slate-200 text-xs font-semibold focus:outline-none"
                                  />
                                </div>

                                {/* Afternoon enabled */}
                                <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                                  <input
                                    type="checkbox"
                                    id={`afternoon-${clinic}-${day.id}`}
                                    checked={dayState.afternoonEnabled}
                                    onChange={(e) => handleCheckboxChange(clinic, day.id, "afternoonEnabled", e.target.checked)}
                                    className="w-3.5 h-3.5 rounded text-teal-600 border-slate-300 focus:ring-teal-500 accent-teal-600 cursor-pointer"
                                  />
                                  <label htmlFor={`afternoon-${clinic}-${day.id}`} className="text-[10px] text-slate-500 cursor-pointer">
                                    Turno Tarde
                                  </label>
                                </div>

                                {/* Afternoon range */}
                                {dayState.afternoonEnabled && (
                                  <div className="flex items-center gap-1.5 pl-2">
                                    <span className="text-[10px] text-slate-400">Tarde:</span>
                                    <input
                                      type="text"
                                      value={dayState.afternoonStart}
                                      onChange={(e) => handleTimeChange(clinic, day.id, "afternoonStart", e.target.value)}
                                      placeholder="14:00"
                                      className="w-14 px-1.5 py-1 text-center rounded border border-slate-200 text-xs font-semibold focus:outline-none"
                                    />
                                    <span className="text-slate-400">&mdash;</span>
                                    <input
                                      type="text"
                                      value={dayState.afternoonEnd}
                                      onChange={(e) => handleTimeChange(clinic, day.id, "afternoonEnd", e.target.value)}
                                      placeholder="18:00"
                                      className="w-14 px-1.5 py-1 text-center rounded border border-slate-200 text-xs font-semibold focus:outline-none"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {!dayState.enabled && (
                              <span className="text-[10px] text-slate-300 font-semibold italic">No atiende este día</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0 animate-bounce" />
                <span>¡Configuración guardada exitosamente!</span>
              </div>
            )}

            {/* Form actions */}
            <div className="flex gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary hover:bg-teal-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Configuración
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
