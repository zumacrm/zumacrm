"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  Plus, 
  UserCheck, 
  Webhook, 
  Save, 
  CheckCircle,
  X,
  UserPlus,
  Mail,
  Smartphone
} from "lucide-react";

interface AdminUser {
  name: string;
  email: string;
  role: "Propietario" | "Asistente" | "Soporte";
  status: "active" | "inactive";
}

interface RolePermissions {
  agendarManual: boolean;
  modificarTurno: boolean;
  modificarPrecio: boolean;
  configurarAgenda: boolean;
  modificarSeña: boolean;
  reintegrosMP: boolean;
  verEstadisticas: boolean;
}

const DEFAULT_PERMISSIONS: { [key in "Propietario" | "Asistente" | "Soporte"]: RolePermissions } = {
  Propietario: {
    agendarManual: true,
    modificarTurno: true,
    modificarPrecio: true,
    configurarAgenda: true,
    modificarSeña: true,
    reintegrosMP: true,
    verEstadisticas: true
  },
  Asistente: {
    agendarManual: true,
    modificarTurno: true,
    modificarPrecio: false,
    configurarAgenda: true,
    modificarSeña: false,
    reintegrosMP: false,
    verEstadisticas: false
  },
  Soporte: {
    agendarManual: false,
    modificarTurno: false,
    modificarPrecio: false,
    configurarAgenda: false,
    modificarSeña: false,
    reintegrosMP: false,
    verEstadisticas: true
  }
};

export default function ConfiguracionView() {
  const [showToken, setShowToken] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [permSuccessMsg, setPermSuccessMsg] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Mock webhook inputs
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:3000/api/pagos/webhook");
  const [whatsappTemplate, setWhatsappTemplate] = useState("¡Hola {paciente}! Tu turno con el Dr. Carlos Jensen para {estudio} el {fecha} a las {hora} ha sido confirmado.");

  // Collaborators lists
  const [users, setUsers] = useState<AdminUser[]>([
    { name: "Dr. Carlos Jensen", email: "carlos.jensen@consultorio.com", role: "Propietario", status: "active" },
    { name: "María López", email: "maria.lopez@consultorio.com", role: "Asistente", status: "active" },
    { name: "Tomás Jensen", email: "tomas.j@gmail.com", role: "Soporte", status: "active" }
  ]);

  // Invite user form states
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    role: "Asistente" as "Propietario" | "Asistente" | "Soporte"
  });

  // Seña configuration states
  const [depositType, setDepositType] = useState<"percentage" | "fixed">("percentage");
  const [depositValue, setDepositValue] = useState<number>(50);
  const [saveDepositSuccess, setSaveDepositSuccess] = useState(false);

  // Permissions matrices configurations
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<"Propietario" | "Asistente" | "Soporte">("Asistente");
  const [rolePermissions, setRolePermissions] = useState(DEFAULT_PERMISSIONS);

  const [outboxLogs, setOutboxLogs] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zuma_outgoing_notifications_log");
      if (saved) {
        setOutboxLogs(JSON.parse(saved));
      }
    }
  }, []);

  const handleTriggerTomorrowReminders = () => {
    const list = mockDB.getTurnos();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0]; // "yyyy-MM-dd"
    const tomorrowTurnos = list.filter(t => t.fecha === tomorrowStr && t.partnerId === "dr-carlos-jensen");
    
    if (tomorrowTurnos.length === 0) {
      alert("No hay turnos agendados para mañana para realizar recordatorios.");
      return;
    }

    const currentLogs = localStorage.getItem("zuma_outgoing_notifications_log");
    const logs = currentLogs ? JSON.parse(currentLogs) : [];

    const newLogs = [...logs];
    tomorrowTurnos.forEach(t => {
      const patientName = `${t.paciente.nombre} ${t.paciente.apellido}`;
      const msgText = `¡Hola ${t.paciente.nombre}! Te recordamos tu turno para mañana ${t.fecha} a las ${t.hora_inicio || t.hora || "09:00"} hs en Consultorio Central Banda.`;
      
      newLogs.unshift({
        id: `log_wh_${Math.random()}`,
        time: new Date().toLocaleTimeString(),
        channel: "WhatsApp",
        recipient: t.paciente.telefono,
        message: msgText,
        status: "ENVIADO"
      });

      newLogs.unshift({
        id: `log_em_${Math.random()}`,
        time: new Date().toLocaleTimeString(),
        channel: "Email",
        recipient: t.paciente.email,
        message: `Estimado/a ${patientName}, este es un recordatorio automático para tu consulta de ${t.tipo_estudio} de mañana a las ${t.hora_inicio || t.hora || "09:00"} hs con el Dr. Carlos Jensen.`,
        status: "ENTREGADO"
      });
    });

    localStorage.setItem("zuma_outgoing_notifications_log", JSON.stringify(newLogs));
    setOutboxLogs(newLogs);
    alert(`Se despacharon con éxito ${tomorrowTurnos.length * 2} recordatorios para el día de mañana (${tomorrowStr}).`);
  };

  // Load configuration from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedType = sessionStorage.getItem("zuma_deposit_type");
      const savedVal = sessionStorage.getItem("zuma_deposit_value");
      if (savedType) setDepositType(savedType as any);
      if (savedVal) setDepositValue(parseFloat(savedVal));
    }
  }, []);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 2000);
  };

  const handleSaveDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveDepositSuccess(true);
    sessionStorage.setItem("zuma_deposit_type", depositType);
    sessionStorage.setItem("zuma_deposit_value", depositValue.toString());
    setTimeout(() => setSaveDepositSuccess(false), 2000);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;

    setUsers(prev => [
      ...prev,
      {
        name: inviteForm.name,
        email: inviteForm.email,
        role: inviteForm.role,
        status: "active"
      }
    ]);
    setInviteForm({ name: "", email: "", role: "Asistente" });
    setShowInviteModal(false);
  };

  const handlePermissionCheckboxChange = (key: keyof RolePermissions, val: boolean) => {
    setRolePermissions(prev => ({
      ...prev,
      [selectedRoleForMatrix]: {
        ...prev[selectedRoleForMatrix],
        [key]: val
      }
    }));
  };

  const handleUpdatePermissions = () => {
    setPermSuccessMsg(true);
    setTimeout(() => setPermSuccessMsg(false), 2500);
  };

  const activePerms = rolePermissions[selectedRoleForMatrix];

  return (
    <div className="flex flex-col gap-6 animate-slide-in relative">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Configuración Administrativa</h1>
        <p className="text-xs text-slate-400">Administra usuarios colaboradores, permisos de rol, integraciones de pago y plantillas de WhatsApp.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: API configs & Collaborators list */}
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

          {/* Booking & Deposits Config Form */}
          <form onSubmit={handleSaveDeposit} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Shield className="w-4 h-4 text-primary" />
              Configuración de Cobros y Señas
            </h2>

            <p className="text-[10px] text-slate-400 leading-normal">
              Define el monto que deben abonar tus clientes de forma anticipada para congelar el turno y confirmar la reserva.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Cobro Anticipado</label>
                <select
                  value={depositType}
                  onChange={(e) => setDepositType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="percentage">Porcentaje sobre el total (%)</option>
                  <option value="fixed">Monto Fijo de Reserva ($)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor Requerido</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    required
                    value={depositValue}
                    onChange={(e) => setDepositValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-semibold text-slate-750"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-450 font-bold">
                    {depositType === "percentage" ? "%" : "ARS"}
                  </span>
                </div>
              </div>
            </div>

            {saveDepositSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>¡Configuración de señas y depósitos guardada exitosamente!</span>
              </div>
            )}

            <button
              type="submit"
              className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Save className="w-4 h-4" />
              Guardar Configuración de Cobros
            </button>
          </form>

          {/* Outbox Notifications log terminal (Fase 7 Extra) */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4 animate-slide-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                <Smartphone className="w-4.5 h-4.5 text-primary" />
                Motor de Envío de Notificaciones (Email & WhatsApp Outbox)
              </h2>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">zuma-crm/outbox</span>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal">
              El motor despacha automáticamente correos electrónicos y mensajes de WhatsApp en tiempo real al confirmar, cancelar o recordar turnos. Presiona el botón para simular la ejecución de recordatorios automáticos del día de mañana.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTriggerTomorrowReminders}
                className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer flex-1 text-center"
              >
                Disparar Recordatorios de Mañana
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("zuma_outgoing_notifications_log");
                  setOutboxLogs([]);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-3 border border-slate-200 rounded-xl text-xs transition-all cursor-pointer text-center"
              >
                Limpiar Outbox
              </button>
            </div>

            {/* Outgoing terminal list */}
            <div className="bg-slate-900 rounded-xl p-3 font-mono text-[9.5px] text-slate-350 leading-relaxed border border-slate-850 h-44 overflow-y-auto">
              <span className="text-slate-500 block border-b border-slate-800 pb-1.5 mb-1.5">// Outgoing messages queue (ZUMA CRM Daemon)</span>
              {outboxLogs.length === 0 ? (
                <span className="text-slate-600 font-sans text-[10px]">Sin envíos pendientes. Registra un nuevo turno o simula recordatorios para ver la cola de despacho.</span>
              ) : (
                outboxLogs.map((log, idx) => (
                  <div key={idx} className="mb-2 border-b border-slate-800 pb-1.5">
                    <div className="flex justify-between text-[8px] text-slate-550 mb-0.5">
                      <span>[{log.time}] &bull; {log.channel} &bull; {log.recipient}</span>
                      <span className="text-emerald-500 font-bold">{log.status}</span>
                    </div>
                    <p className="text-slate-300 break-words">{log.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Collaborator Users List */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-primary" />
                Colaboradores de la Cuenta
              </h2>
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="text-xs font-bold text-indigo-650 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Invitar Colaborador
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {users.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-xs hover:border-slate-300 transition-all select-none">
                  <div>
                    <h4 className="font-bold text-slate-850">{user.name}</h4>
                    <span className="text-[10px] text-slate-400">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border
                      ${user.role === "Propietario" ? "bg-indigo-50 border-indigo-150 text-indigo-700" : 
                        user.role === "Asistente" ? "bg-teal-50 border-teal-150 text-teal-700" : 
                        "bg-slate-100 border-slate-200 text-slate-600"}`}
                    >
                      {user.role}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Roles Matrix Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-4 h-fit sticky top-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-primary" />
            Configurador de Permisos
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seleccionar Rol a Configurar</label>
            <select
              value={selectedRoleForMatrix}
              onChange={(e) => {
                setSelectedRoleForMatrix(e.target.value as any);
                setPermSuccessMsg(false);
              }}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="Propietario">👑 Propietario</option>
              <option value="Asistente">💼 Asistente</option>
              <option value="Soporte">🛠 Soporte</option>
            </select>
          </div>

          <p className="text-[10px] text-slate-400 leading-normal mt-1">
            Ajusta los accesos y capacidades que tendrán todos los usuarios asignados al rol de <span className="font-bold text-slate-600">{selectedRoleForMatrix}</span>.
          </p>

          <div className="flex flex-col gap-3.5 mt-2">
            {[
              { key: "agendarManual", label: "Agendar turnos manuales" },
              { key: "modificarTurno", label: "Modificar fecha / hora de turnos" },
              { key: "modificarPrecio", label: "Modificar precios de servicios" },
              { key: "configurarAgenda", label: "Configurar días y horas de atención" },
              { key: "modificarSeña", label: "Modificar porcentaje de seña requerido" },
              { key: "reintegrosMP", label: "Ejecutar devoluciones de señas" },
              { key: "verEstadisticas", label: "Visualizar panel de estadísticas de facturación" }
            ].map((p) => {
              const checked = activePerms[p.key as keyof RolePermissions];
              // Propietarios always have all permissions active in this demo setup
              const isDisabled = selectedRoleForMatrix === "Propietario";
              
              return (
                <label 
                  key={p.key} 
                  className={`flex items-center gap-2.5 text-xs font-medium cursor-pointer transition-all
                    ${isDisabled ? "opacity-60 cursor-not-allowed text-slate-400" : "text-slate-600 hover:text-slate-800"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isDisabled}
                    onChange={(e) => handlePermissionCheckboxChange(p.key as keyof RolePermissions, e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-650 border-slate-350 focus:ring-indigo-500 accent-indigo-650 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span>{p.label}</span>
                </label>
              );
            })}
          </div>

          {permSuccessMsg && (
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-[10px] font-bold flex items-center gap-1.5 mt-2 animate-slide-in">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Permisos del rol {selectedRoleForMatrix} guardados.</span>
            </div>
          )}

          <div className="h-px bg-slate-100 my-1" />

          <button
            type="button"
            onClick={handleUpdatePermissions}
            className="w-full bg-[#0f172a] hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center shadow-sm"
          >
            Actualizar Permisos
          </button>
        </div>
      </div>

      {/* Invite User Modal Overlay */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-up flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Invitar Colaborador</h3>
              </div>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Martínez"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@consultorio.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rol de Acceso</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="Propietario">👑 Propietario (Acceso total)</option>
                  <option value="Asistente">💼 Asistente (Gestión operativa)</option>
                  <option value="Soporte">🛠 Soporte (Mantenimiento)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Enviar Invitación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
