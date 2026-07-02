"use client";

import { useState } from "react";
import { Shield, Key, Eye, EyeOff, Plus, UserCheck, Webhook, Save, CheckCircle } from "lucide-react";

interface AdminUser {
  name: string;
  email: string;
  role: "Propietario" | "Secretaría" | "Técnico";
  status: "active" | "inactive";
}

export default function ConfiguracionView() {
  const [showToken, setShowToken] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  
  // Mock webhook inputs
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:3000/api/pagos/webhook");
  const [whatsappTemplate, setWhatsappTemplate] = useState("¡Hola {paciente}! Tu turno con el Dr. Carlos Jensen para {estudio} el {fecha} a las {hora} ha sido confirmado.");

  const [users, setUsers] = useState<AdminUser[]>([
    { name: "Dr. Carlos Jensen", email: "carlos.jensen@consultorio.com", role: "Propietario", status: "active" },
    { name: "María López", email: "maria.lopez@consultorio.com", role: "Secretaría", status: "active" },
    { name: "Tomás Jensen", email: "tomas.j@gmail.com", role: "Técnico", status: "active" }
  ]);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Configuración Administrativa</h1>
        <p className="text-xs text-slate-400">Administra usuarios de secretaría, permisos de acceso, pasarelas de pago y webhooks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* API Credentials & Webhook configs */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Key values form */}
          <form onSubmit={handleSaveKeys} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Key className="w-4 h-4 text-primary" />
              Integraciones y Credenciales
            </h2>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Mercado Pago Access Token (Seña)</label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  readOnly
                  value="APP_USR-8392182049280492-063012-7bb3d07e1c8a-1298379"
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none bg-slate-50 text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showToken ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Endpoint de Webhook de Notificación (Pagos)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                />
                <div className="bg-slate-100 border border-slate-200 p-2 rounded-lg text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <Webhook className="w-3.5 h-3.5" />
                  POST
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Plantilla Mensaje de WhatsApp (Twilio)</label>
              <textarea
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary resize-none leading-relaxed"
              />
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>¡Credenciales y parámetros webhooks actualizados!</span>
              </div>
            )}

            <button
              type="submit"
              className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Save className="w-4 h-4" />
              Guardar Configuración API
            </button>
          </form>

          {/* Admin user management list */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-primary" />
                Usuarios de la Cuenta
              </h2>
              <button
                type="button"
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Invitar Usuario
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {users.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-800">{user.name}</h4>
                    <span className="text-[10px] text-slate-400">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded">
                      {user.role}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Roles Permission matrix card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-4 sticky top-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-primary" />
            Permisos de Rol (Secretaría)
          </h2>

          <p className="text-[10px] text-slate-400 leading-normal">
            Define qué operaciones puede realizar la secretaria/secretario en el panel sin requerir tu clave de firma digital.
          </p>

          <div className="flex flex-col gap-3 mt-2">
            {[
              { label: "Agendar turnos manuales", checked: true },
              { label: "Modificar fecha / hora del turno", checked: true },
              { label: "Modificar precio de consulta", checked: false },
              { label: "Configurar días y horas de atención", checked: true },
              { label: "Modificar porcentaje de seña requerido", checked: false },
              { label: "Ejecutar reintegros de seña MP", checked: false }
            ].map((p, idx) => (
              <label key={idx} className="flex items-center gap-2.5 text-xs text-slate-600 font-medium cursor-pointer hover:text-slate-800">
                <input
                  type="checkbox"
                  defaultChecked={p.checked}
                  className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 accent-teal-600 cursor-pointer"
                />
                <span>{p.label}</span>
              </label>
            ))}
          </div>

          <div className="h-px bg-slate-100 my-1" />

          <button
            type="button"
            onClick={() => {
              alert("Permisos de roles actualizados.");
            }}
            className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
          >
            Actualizar Permisos
          </button>
        </div>
      </div>
    </div>
  );
}
