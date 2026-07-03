"use client";

import { useState, useEffect } from "react";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  CreditCard, 
  CheckCircle2, 
  Smile,
  ShieldAlert
} from "lucide-react";

interface PatientSession {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  obraSocial: string;
  avatarKey?: string; // e.g. "avatar_man", "avatar_woman"
}

interface PacientePerfilViewProps {
  currentPatient: PatientSession | null;
  onUpdatePatient: (updated: PatientSession) => void;
}

// Avatars options with premium colors
const AVAILABLE_AVATARS = [
  { key: "avatar_man_1", label: "Hombre Azul", bg: "bg-blue-500", emoji: "👨" },
  { key: "avatar_woman_1", label: "Mujer Rosa", bg: "bg-pink-500", emoji: "👩" },
  { key: "avatar_man_2", label: "Hombre Verde", bg: "bg-teal-500", emoji: "🧔" },
  { key: "avatar_woman_2", label: "Mujer Morada", bg: "bg-purple-500", emoji: "👩‍🦰" },
  { key: "avatar_kid", label: "Joven Amarillo", bg: "bg-amber-500", emoji: "🧑" },
  { key: "avatar_glasses", label: "Gafas", bg: "bg-indigo-500", emoji: "🤓" }
];

export default function PacientePerfilView({ currentPatient, onUpdatePatient }: PacientePerfilViewProps) {
  const [formData, setFormData] = useState<PatientSession>({
    dni: "",
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    obraSocial: "Particular",
    avatarKey: "avatar_man_1"
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (currentPatient) {
      setFormData({
        ...currentPatient,
        avatarKey: currentPatient.avatarKey || "avatar_man_1"
      });
    }
  }, [currentPatient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePatient(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const getActiveAvatar = () => {
    return AVAILABLE_AVATARS.find(a => a.key === formData.avatarKey) || AVAILABLE_AVATARS[0];
  };

  const activeAvatar = getActiveAvatar();

  if (!currentPatient) {
    return (
      <div className="max-w-md mx-auto bg-white border border-slate-200 p-8 rounded-2xl shadow-sm text-center flex flex-col items-center gap-4 animate-slide-in mt-6">
        <ShieldAlert className="w-12 h-12 text-slate-300 stroke-[1.2]" />
        <h3 className="font-semibold text-slate-700 text-sm font-display">Perfil del Cliente</h3>
        <p className="text-xs text-slate-400 leading-normal">
          Aún no te has identificado en el sistema. Inicia una reserva de turno e ingresa tus datos en el último paso para registrar tu perfil.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-slide-in">
      
      {/* Visual Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-5">
        <div className={`w-16 h-16 rounded-full ${activeAvatar.bg} text-white flex items-center justify-center text-3xl shadow-sm shrink-0`}>
          {activeAvatar.emoji}
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-lg font-bold text-slate-800 leading-snug">
            {formData.nombre} {formData.apellido}
          </h2>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">DNI: {formData.dni} &bull; Prepaga: {formData.obraSocial}</span>
          <span className="text-[9px] font-bold text-teal-600 bg-teal-50 border border-teal-100 rounded px-1.5 py-0.5 mt-2.5 inline-block uppercase tracking-wider">
            Sesión de Cliente Activa
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Editar Datos del Cliente</h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Avatar Selector Grid */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-slate-400" />
              Selecciona tu Avatar
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {AVAILABLE_AVATARS.map((av) => {
                const isSelected = formData.avatarKey === av.key;
                return (
                  <button
                    key={av.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatarKey: av.key })}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer
                      ${isSelected 
                        ? "bg-slate-50 border-indigo-500 shadow-sm" 
                        : "bg-white border-slate-200 hover:border-slate-300"}`}
                  >
                    <span className={`w-8 h-8 rounded-full ${av.bg} text-white flex items-center justify-center text-lg`}>
                      {av.emoji}
                    </span>
                    <span className="text-[9px] font-medium text-slate-600 truncate max-w-full">
                      {av.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Apellido</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">WhatsApp / Celular</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Obra Social / Prepaga</label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={formData.obraSocial}
                  onChange={(e) => setFormData({ ...formData, obraSocial: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500/50"
                >
                  <option value="Particular">Particular / Sin Prepaga</option>
                  <option value="OSDE">OSDE</option>
                  <option value="Swiss Medical">Swiss Medical</option>
                  <option value="Galeno">Galeno</option>
                  <option value="OSECAC">OSECAC</option>
                  <option value="PAMI">PAMI</option>
                  <option value="IPS">IPS</option>
                </select>
              </div>
            </div>

          </div>

          <div className="flex justify-end items-center gap-3 mt-2">
            {showSuccess && (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Perfil guardado exitosamente
              </span>
            )}
            
            <button
              type="submit"
              className="bg-primary hover:bg-teal-600 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Guardar Cambios
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
