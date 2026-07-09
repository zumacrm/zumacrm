"use client";

import { useState, useEffect } from "react";
import { 
  Home as HomeIcon, 
  LayoutDashboard, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  BarChart2, 
  Bell, 
  HelpCircle, 
  LogOut, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Layers,
  Shield,
  Calendar,
  FileText,
  Sliders,
  Heart,
  Activity,
  Building2,
  Stethoscope,
  MapPin,
  Tag,
  XCircle,
  CreditCard,
  MessageSquare
} from "lucide-react";
import InicioView from "@/components/views/InicioView";
import PerfilPublicoView from "@/components/views/PerfilPublicoView";
import AgendaView from "@/components/views/AgendaView";
import ConfiguracionView from "@/components/views/ConfiguracionView";
import FacturacionView from "@/components/views/FacturacionView";
import ReservarTurnoView from "@/components/views/ReservarTurnoView";
import MisTurnosView from "@/components/views/MisTurnosView";
import PacienteDashboardView from "@/components/views/PacienteDashboardView";
import PacientePerfilView from "@/components/views/PacientePerfilView";
import PacienteUbicacionesView from "@/components/views/PacienteUbicacionesView";
import SaaSConfigView from "@/components/views/SaaSConfigView";
import PartnerStatsView from "@/components/views/PartnerStatsView";
import PartnerReservasAdminView from "@/components/views/PartnerReservasAdminView";
import PromocionesView from "@/components/views/PromocionesView";
import ChatView from "@/components/views/ChatView";
import { mockDB } from "@/lib/mockData";

type Role = "superadmin" | "partner" | "patient_guest" | "patient_registered";

interface PatientSession {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  obraSocial: string;
  avatarKey?: string;
}

const AVAILABLE_AVATARS = [
  { key: "avatar_man_1", emoji: "👨" },
  { key: "avatar_woman_1", emoji: "👩" },
  { key: "avatar_man_2", emoji: "🧔" },
  { key: "avatar_woman_2", emoji: "👩‍🦰" },
  { key: "avatar_kid", emoji: "🧑" },
  { key: "avatar_glasses", emoji: "🤓" }
];

export default function Home() {
  const [role, setRole] = useState<Role>("patient_guest");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [searchText, setSearchText] = useState("");
  
  // Lock screen authorization states
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [accessCode, setAccessCode] = useState("");
  const [loginError, setLoginError] = useState("");

  // Notification states
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);

  const handleNotificationClick = (notifId: string) => {
    setExpandedNotifId(prev => prev === notifId ? null : notifId);
    if (role === "superadmin") {
      setSuperadminNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
    } else if (role === "partner") {
      setPartnerNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
    } else {
      setPatientNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
    }
  };

  const [partnerNotifications, setPartnerNotifications] = useState([
    { id: "pn1", title: "Nuevo Turno Agendado", desc: "María Álvarez reservó Consulta general el 16/07/2026.", time: "Hace 2 horas", type: "booking", isRead: false },
    { id: "pn2", title: "Seña Acreditada", desc: "Pago de seña de $15.000 de Martín Díaz recibido por Mercado Pago.", time: "Hace 4 horas", type: "payment", isRead: false },
    { id: "pn3", title: "Cupón Utilizado", desc: "El cliente Juan Pérez aplicó el cupón PRIMERTURNO.", time: "Ayer", type: "coupon", isRead: true }
  ]);
  const [patientNotifications, setPatientNotifications] = useState([
    { id: "an1", title: "Reserva Pre-Confirmada", desc: "Tu reserva con el Dr. Carlos Jensen para el 06/07/2026 fue agendada.", time: "Hace 1 hora", type: "booking", isRead: false },
    { id: "an2", title: "Pago de Seña Acreditado", desc: "Tu pago de seña por $12.500 fue aprobado por Mercado Pago.", time: "Hace 1 hora", type: "payment", isRead: false },
    { id: "an3", title: "Beneficio Exclusivo", desc: "El Dr. Carlos Jensen activó la promo PRIMERTURNO por $5.000.", time: "Hace 2 días", type: "coupon", isRead: true }
  ]);
  const [superadminNotifications, setSuperadminNotifications] = useState([
    { id: "sn1", title: "Nuevo Socio Registrado", desc: "El socio 'Bar Lugones La Banda' se unió en plan Oro.", time: "Ayer", type: "booking", isRead: false },
    { id: "sn2", title: "Abono Liquidado", desc: "El Dr. Carlos Jensen abonó su factura del mes de junio.", time: "Hace 15 días", type: "payment", isRead: true }
  ]);

  const getActiveNotifications = () => {
    if (role === "superadmin") return superadminNotifications;
    if (role === "partner") return partnerNotifications;
    return patientNotifications;
  };

  const handleMarkAllNotificationsAsRead = () => {
    if (role === "superadmin") {
      setSuperadminNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } else if (role === "partner") {
      setPartnerNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } else {
      setPatientNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const activeNotifications = getActiveNotifications();
  const unreadCount = activeNotifications.filter(n => !n.isRead).length;

  // Patient session state
  const [patientSession, setPatientSession] = useState<PatientSession | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(null);

  // Active Partner logo sync trigger
  const [partnerLogoUrl, setPartnerLogoUrl] = useState("emblem_doctor");
  const [partnerLogoColor, setPartnerLogoColor] = useState("bg-teal-500");
  const [partnerName, setPartnerName] = useState("Dr. Carlos Jensen");
  const [partnerEmail, setPartnerEmail] = useState("carlos.jensen@consultorio.com");

  // Check session storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("zuma_unlocked");
      if (saved === "true") {
        setIsUnlocked(true);
        const savedRole = sessionStorage.getItem("zuma_role") as Role;
        if (savedRole) {
          setRole(savedRole);
          if (savedRole === "superadmin") setActiveTab("inicio");
          if (savedRole === "partner") setActiveTab("agenda");
          if (savedRole === "patient_guest" || savedRole === "patient_registered") setActiveTab("dashboard");
        }
      } else {
        setIsUnlocked(true);
        setRole("patient_guest");
        setActiveTab("dashboard");
      }
    }
  }, []);

  // Sync partner logo details
  useEffect(() => {
    const partner = mockDB.getPartners().find(p => p.id === "dr-carlos-jensen");
    if (partner) {
      setPartnerLogoUrl(partner.logoUrl || "emblem_doctor");
      setPartnerLogoColor(partner.logoColor || "bg-teal-500");
      setPartnerName(partner.name);
      setPartnerEmail(partner.email);
    }
  }, [activeTab, role]);

  // Force collapse on screens under 768px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    sessionStorage.setItem("zuma_role", newRole);
    if (newRole === "superadmin") {
      setActiveTab("inicio");
      setPatientSession(null);
    } else if (newRole === "partner") {
      setActiveTab("agenda");
      setPatientSession(null);
    } else if (newRole === "patient_guest") {
      setActiveTab("dashboard");
      setPatientSession(null);
    } else if (newRole === "patient_registered") {
      setActiveTab("dashboard");
      setPatientSession({
        dni: "20444333",
        nombre: "Roberto",
        apellido: "Sosa",
        telefono: "+5493854111222",
        email: "roberto.sosa@gmail.com",
        obraSocial: "OSDE",
        avatarKey: "avatar_glasses"
      });
    }
  };

  const handleRegisterPatient = (patient: PatientSession) => {
    setPatientSession(patient);
    setRole("patient_registered");
    sessionStorage.setItem("zuma_role", "patient_registered");
  };

  const handleUpdatePatient = (updated: PatientSession) => {
    setPatientSession(updated);
  };

  const handleSelectPartnerFromDashboard = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setSelectedLocationName(null);
    setActiveTab("reservar");
  };

  const handleSelectLocationFromLocationsList = (partnerId: string, locationName: string) => {
    setSelectedPartnerId(partnerId);
    setSelectedLocationName(locationName);
    setActiveTab("reservar");
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = accessCode.trim();
    if (code === "Arq") {
      handleRoleChange("superadmin");
      setIsUnlocked(true);
      sessionStorage.setItem("zuma_unlocked", "true");
      setLoginError("");
    } else if (code.toLowerCase() === "jensen") {
      handleRoleChange("partner");
      setIsUnlocked(true);
      sessionStorage.setItem("zuma_unlocked", "true");
      setLoginError("");
    } else if (code.toLowerCase() === "paciente") {
      handleRoleChange("patient_guest");
      setIsUnlocked(true);
      sessionStorage.setItem("zuma_unlocked", "true");
      setLoginError("");
    } else {
      setLoginError("Código de acceso incorrecto.");
    }
  };

  const handleLogout = () => {
    setShowLogoutAlert(true);
    setTimeout(() => {
      setShowLogoutAlert(false);
      setIsUnlocked(false);
      setAccessCode("");
      sessionStorage.removeItem("zuma_unlocked");
      sessionStorage.removeItem("zuma_role");
    }, 1200);
  };

  const getMenuItems = () => {
    switch (role) {
      case "superadmin":
        return [
          { id: "inicio", label: "Home", icon: HomeIcon, desc: "Directorio de Socios" },
          { id: "saas_config", label: "SaaS Config", icon: Sliders, desc: "Precios y Comisiones" },
          { id: "facturacion", label: "Global Reporting", icon: BarChart2, desc: "MRR e Invoicing Global" }
        ];
      case "partner":
        return [
          { id: "agenda", label: "Dashboard", icon: LayoutDashboard, desc: "Mi Agenda de Turnos" },
          { id: "perfil", label: "Profile", icon: UserIcon, desc: "Mi Perfil Público" },
          { id: "estadisticas", label: "Estadísticas", icon: BarChart2, desc: "Rendimiento y Contabilidad" },
          { id: "reservas_admin", label: "Administrar", icon: FileText, desc: "Gestión Completa de Reservas" },
          { id: "promociones", label: "Promociones", icon: Tag, desc: "Cupones y Ofertas" },
          { id: "mensajes", label: "Mensajes", icon: MessageSquare, desc: "Chat directo con clientes" },
          { id: "config", label: "Settings", icon: SettingsIcon, desc: "Configuración Admin" },
          { id: "facturacion", label: "Subscription", icon: Layers, desc: "Abonos y Facturas" }
        ];
      case "patient_guest":
      case "patient_registered":
        return [
          { id: "dashboard", label: "Dashboard", icon: HomeIcon, desc: "Directorio de Socios" },
          { id: "ubicaciones", label: "Ubicaciones", icon: MapPin, desc: "Sedes y locales asociados" },
          { id: "promociones", label: "Promociones", icon: Tag, desc: "Cupones y Ofertas Especiales" },
          { id: "mensajes", label: "Mensajes", icon: MessageSquare, desc: "Chat directo con tu prestador" },
          { id: "historial", label: "Mis Reservas", icon: FileText, desc: "Gestionar reservas y señas" },
          { id: "paciente_perfil", label: "Profile", icon: UserIcon, desc: "Mi Información Personal" }
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const renderActiveView = () => {
    switch (activeTab) {
      case "inicio":
        return <InicioView />;
      case "saas_config":
        return <SaaSConfigView />;
      case "agenda":
        return <AgendaView />;
      case "perfil":
        return <PerfilPublicoView />;
      case "estadisticas":
        return <PartnerStatsView partnerId="dr-carlos-jensen" />;
      case "reservas_admin":
        return <PartnerReservasAdminView partnerId="dr-carlos-jensen" />;
      case "promociones":
        return <PromocionesView role={role} partnerId={role === "partner" ? "dr-carlos-jensen" : undefined} />;
      case "mensajes":
        return <ChatView role={role} partnerId={role === "partner" ? "dr-carlos-jensen" : undefined} patientDni={role !== "partner" ? (patientSession?.dni || "38111222") : undefined} />;
      case "config":
        return <ConfiguracionView />;
      case "facturacion":
        return <FacturacionView role={role} />;
      case "dashboard":
        return <PacienteDashboardView onSelectPartner={handleSelectPartnerFromDashboard} />;
      case "ubicaciones":
        return <PacienteUbicacionesView onSelectLocation={handleSelectLocationFromLocationsList} />;
      case "paciente_perfil":
        return <PacientePerfilView currentPatient={patientSession} onUpdatePatient={handleUpdatePatient} />;
      case "reservar":
        return (
          <ReservarTurnoView 
            currentPatient={patientSession} 
            onRegisterPatient={handleRegisterPatient}
            onViewHistory={() => setActiveTab("historial")}
            partnerId={selectedPartnerId}
            initialLocationName={selectedLocationName}
          />
        );
      case "historial":
        return (
          <MisTurnosView 
            currentPatient={patientSession} 
            onGoToBooking={() => setActiveTab("reservar")}
          />
        );
      default:
        return <InicioView />;
    }
  };

  const getPatientAvatarEmoji = () => {
    if (!patientSession?.avatarKey) return "👤";
    const found = AVAILABLE_AVATARS.find(a => a.key === patientSession.avatarKey);
    return found ? found.emoji : "👤";
  };

  const getPartnerEmblemIcon = (key: string) => {
    if (key.startsWith("data:image/") || key.startsWith("http")) {
      return <img src={key} alt="Logo" className="w-full h-full object-cover rounded-lg" />;
    }
    if (key === "emblem_doctor") return <Stethoscope className="w-3.5 h-3.5" />;
    if (key === "emblem_heart") return <Heart className="w-3.5 h-3.5" />;
    if (key === "emblem_cross") return <Activity className="w-3.5 h-3.5" />;
    return <Building2 className="w-3.5 h-3.5" />;
  };

  // RENDER ACCESS LOCK OVERLAY
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#0c0c0e] flex items-center justify-center p-4 z-50 select-none font-sans">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-teal-600/10 blur-3xl" />

        <div className="w-full max-w-sm bg-[#131316] border border-[#27272a]/40 p-8 rounded-2xl shadow-2xl relative z-10 flex flex-col gap-6 text-center animate-slide-in">
          <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-600/90 text-indigo-100 flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
            <Layers className="w-6 h-6 stroke-[2]" />
          </div>

          <div>
            <h1 className="font-display font-bold text-white text-lg tracking-tight">ZUMA CRM</h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-normal">
              Acceso Restringido &bull; Prototipo de Validación Comercial
            </p>
          </div>

          <form onSubmit={handleUnlockSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Código de Acceso"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#18181b] border border-[#27272a]/80 rounded-xl text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                autoFocus
              />
            </div>

            {loginError && (
              <span className="text-[10px] text-rose-500 font-semibold leading-none text-left pl-1">
                {loginError}
              </span>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Desbloquear
            </button>
          </form>

          <div className="h-px bg-[#18181b]" />

          <div className="text-[10px] text-slate-600 leading-normal flex flex-col gap-1 text-left">
            <p>&bull; Administrador: ingresar <code className="text-slate-400 font-mono">Arq</code></p>
            <p>&bull; Médico: ingresar <code className="text-slate-400 font-mono">jensen</code></p>
            <p>&bull; Cliente: ingresar <code className="text-slate-400 font-mono">paciente</code></p>
          </div>
        </div>
      </div>
    );
  }

  // RENDER WORKSPACE (If Unlocked)
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-800">
      
      {/* 1. COLLAPSIBLE SIDEBAR */}
      <aside 
        className={`h-full bg-[#0c0c0e] border-r border-[#1e1e21] flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 relative z-10 select-none
          ${sidebarCollapsed ? "w-16" : "w-60"}`}
      >
        <div>
          {/* Header */}
          <div className="h-14 border-b border-[#18181b] flex items-center px-4 justify-between overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-[150px]">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/90 text-indigo-100 flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
                <Layers className="w-4.5 h-4.5 stroke-[2]" />
              </div>
              {!sidebarCollapsed && (
                <span className="font-display font-semibold text-sm tracking-tight text-white animate-fade-in">
                  ZUMA CRM
                </span>
              )}
            </div>
            {!sidebarCollapsed && (
              <button 
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 rounded-md text-slate-500 hover:bg-[#1a1a1c] hover:text-slate-300 cursor-pointer hidden md:block"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="p-3">
            {sidebarCollapsed ? (
              <button 
                onClick={() => setSidebarCollapsed(false)}
                className="w-full h-8 flex items-center justify-center rounded-lg bg-[#18181a] border border-[#27272a]/20 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            ) : (
              <div className="relative animate-fade-in">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-[#18181a] border border-[#27272a]/30 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            )}
          </div>

          {/* Navigation links */}
          <nav className="px-2 flex flex-col gap-1 mt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full group rounded-lg px-2.5 py-2 flex items-center gap-2.5 transition-all text-left relative cursor-pointer
                    ${isActive 
                      ? "bg-[#1d1d1f] text-white shadow-sm font-semibold" 
                      : "text-slate-400 hover:bg-[#131315] hover:text-slate-200"}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                  {!sidebarCollapsed && <span className="text-xs leading-none animate-fade-in">{item.label}</span>}
                  {sidebarCollapsed && (
                    <div className="absolute left-16 bg-[#18181b] text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#27272a]/80 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-200 z-50 shrink-0 whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col gap-1.5 p-2 bg-[#09090b]/40 border-t border-[#18181b]">
          {sidebarCollapsed && (
            <button 
              onClick={() => setSidebarCollapsed(false)}
              className="mx-auto p-1.5 rounded-lg text-slate-500 hover:bg-[#1a1a1c] hover:text-slate-300 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <div className="flex flex-col gap-1 px-1">
            {/* Notification */}
            <button 
              onClick={() => setShowNotificationDrawer(true)}
              className="group w-full flex items-center gap-2.5 py-1.5 rounded text-slate-400 hover:text-slate-200 text-left relative cursor-pointer"
            >
              <div className="relative">
                <Bell className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />}
              </div>
              {!sidebarCollapsed && (
                <div className="flex justify-between items-center flex-1 animate-fade-in text-xs">
                  <span>Notificaciones</span>
                  {unreadCount > 0 && (
                    <span className="bg-indigo-650/90 text-white font-bold text-[8px] px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
              )}
            </button>

            {/* Support */}
            <button 
              onClick={() => alert("Soporte ZUMA: crm@zuma.com")}
              className="group w-full flex items-center gap-2.5 py-1.5 rounded text-slate-400 hover:text-slate-200 text-left relative cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
              {!sidebarCollapsed && <span className="text-xs animate-fade-in">Support</span>}
            </button>
          </div>

          <div className="h-px bg-[#18181b] my-1" />

          {/* User profile avatar footer */}
          {sidebarCollapsed ? (
            <div 
              onClick={handleLogout}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:bg-rose-950 flex items-center justify-center font-bold text-xs mx-auto shadow-sm cursor-pointer transition-colors group relative"
            >
              {role === "superadmin" && "SA"}
              {role === "partner" && "DR"}
              {role === "patient_guest" && "IN"}
              {role === "patient_registered" && getPatientAvatarEmoji()}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-[#141416] border border-[#27272a]/20 p-2.5 rounded-xl shadow-inner animate-fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                {role === "partner" ? (
                  <div className={`w-7 h-7 rounded-lg ${partnerLogoColor} text-white flex items-center justify-center shadow-sm shrink-0`}>
                    {getPartnerEmblemIcon(partnerLogoUrl)}
                  </div>
                ) : (
                  <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm
                    ${role === "superadmin" ? "bg-indigo-600" : "bg-blue-500"}`}>
                    {role === "superadmin" && "SA"}
                    {role === "patient_guest" && "IN"}
                    {role === "patient_registered" && getPatientAvatarEmoji()}
                  </div>
                )}
                
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-white leading-none truncate">
                    {role === "superadmin" && "ZUMA Admin"}
                    {role === "partner" && partnerName}
                    {role === "patient_guest" && "Cliente Invitado"}
                    {role === "patient_registered" && `${patientSession?.nombre} ${patientSession?.apellido}`}
                  </span>
                  <span className="text-[9px] font-medium text-slate-500 mt-1 truncate">
                    {role === "superadmin" && "Plataforma SaaS"}
                    {role === "partner" && partnerEmail}
                    {role === "patient_guest" && "Sin identificar"}
                    {role === "patient_registered" && patientSession?.email}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="p-1 rounded text-slate-500 hover:bg-[#1f1f23] hover:text-rose-400 cursor-pointer"
                title="Cerrar Sesión / Bloquear"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {sidebarCollapsed && (
              <button 
                onClick={() => setSidebarCollapsed(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer md:block"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium truncate">
              <span>ZUMA CRM</span>
              <span>/</span>
              <span className="text-slate-600 capitalize font-bold">
                {activeTab === "inicio" && "Directorio Socios"}
                {activeTab === "saas_config" && "SaaS Config"}
                {activeTab === "agenda" && "Mi Agenda"}
                {activeTab === "perfil" && "Mi Perfil Público"}
                {activeTab === "estadisticas" && "Estadísticas de Socio"}
                {activeTab === "reservas_admin" && "Administración de Reservas"}
                {activeTab === "config" && "Configuración"}
                {activeTab === "facturacion" && (role === "superadmin" ? "Suscripciones Globales" : "Mi Facturación")}
                {activeTab === "dashboard" && "Dashboard Clientes"}
                {activeTab === "reservar" && "Reserva Online"}
                {activeTab === "ubicaciones" && "Ubicaciones"}
                {activeTab === "historial" && "Mis Reservas"}
                {activeTab === "paciente_perfil" && "Mi Perfil"}
              </span>
            </div>
          </div>

          {/* Interactive Role Switcher Selector */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:inline">Rol:</span>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as Role)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="superadmin">👑 ZUMA SuperAdmin</option>
                <option value="partner">🏥 Socio: Dr. Carlos Jensen</option>
                <option value="patient_guest">👤 Cliente Invitado</option>
                <option value="patient_registered">👤🔑 Cliente: Roberto Sosa</option>
              </select>
            </div>

            <div className="w-px h-6 bg-slate-200 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <Shield className="w-4.5 h-4.5 text-indigo-600" />
              <span className="capitalize text-[11px] font-bold">
                {role === "superadmin" && "SuperAdmin"}
                {role === "partner" && "Socio"}
                {role === "patient_guest" && "Invitado"}
                {role === "patient_registered" && "Cliente"}
              </span>
            </div>
          </div>
        </header>

        {/* View Workspace Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          {renderActiveView()}
        </main>
      </div>

      {/* Logout animation overlay */}
      {showLogoutAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 flex flex-col items-center gap-3 max-w-xs text-center">
            <LogOut className="w-12 h-12 text-rose-500 animate-bounce" />
            <h3 className="font-semibold text-slate-800 text-sm">Bloqueando Acceso...</h3>
            <p className="text-xs text-slate-400 leading-normal">Cerrando la sesión de pruebas y asegurando el portal.</p>
          </div>
        </div>
      )}

      {/* Sliding Notification Overlay Panel */}
      {showNotificationDrawer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-slide-in-right">
            <div>
              <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Notificaciones</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Novedades de tu cuenta en tiempo real</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotificationDrawer(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <XCircle className="w-4.5 h-4.5" />
                </button>
              </div>

              {activeNotifications.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-2 mt-6">
                  <Bell className="w-8 h-8 text-slate-350" />
                  <span className="font-semibold text-slate-700 text-xs">No tienes notificaciones</span>
                  <p className="text-[10px] text-slate-400">Te avisaremos cuando ocurra algo importante.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mt-4">
                  {activeNotifications.map((notif) => {
                    const isExpanded = expandedNotifId === notif.id;

                    return (
                      <div 
                        key={notif.id} 
                        onClick={() => handleNotificationClick(notif.id)}
                        className={`p-3.5 rounded-xl border transition-all text-xs flex gap-3 cursor-pointer hover:shadow-xs select-none
                          ${notif.isRead 
                            ? "bg-slate-50 border-slate-150 text-slate-500 hover:border-slate-200" 
                            : "bg-indigo-50/30 border-indigo-150/60 text-slate-750 font-medium hover:bg-indigo-50/50"}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                          ${notif.type === "booking" ? "bg-blue-50 text-blue-600" :
                            notif.type === "payment" ? "bg-emerald-50 text-emerald-600" :
                            "bg-purple-50 text-purple-600"}`}
                        >
                          {notif.type === "booking" ? <Calendar className="w-4 h-4" /> :
                           notif.type === "payment" ? <CreditCard className="w-4 h-4" /> :
                           <Tag className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-slate-850 text-[11px] leading-tight flex items-center gap-1.5 min-w-0">
                              {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 shrink-0" />}
                              <span className="truncate">{notif.title}</span>
                            </span>
                            <span className="text-[9px] text-slate-400 shrink-0 font-medium">{notif.time}</span>
                          </div>
                          <p className={`text-[10px] text-slate-500 leading-normal mt-1 
                            ${isExpanded ? "whitespace-normal break-words" : "truncate"}`}
                          >
                            {notif.desc}
                          </p>
                          {isExpanded && (
                            <span className="text-[8px] font-bold text-indigo-600 mt-2 block uppercase tracking-wider">
                              &bull; Hacer clic para contraer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllNotificationsAsRead}
                className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center mt-6 shadow-md"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
