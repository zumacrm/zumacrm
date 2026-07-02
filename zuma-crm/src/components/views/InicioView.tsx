"use client";

import { useState } from "react";
import { mockDB, Partner } from "@/lib/mockData";
import { Users, DollarSign, UserPlus, Clock, Search, Building2, Plus, CheckCircle, AlertTriangle, ShieldCheck, MapPin, Phone, Mail } from "lucide-react";

export default function InicioView() {
  const [partners, setPartners] = useState<Partner[]>(() => mockDB.getPartners());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  
  // Registration Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: "",
    category: "Médico Cardiólogo",
    cuit: "",
    email: "",
    phone: "",
    address: "",
    bio: ""
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.name || !newPartner.cuit) return;

    const colors = ["bg-teal-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const created: Partner = {
      id: `partner_${Math.random().toString(36).substring(2, 9)}`,
      name: newPartner.name,
      category: newPartner.category,
      status: "active",
      cuit: newPartner.cuit,
      email: newPartner.email || "info@empresa.com",
      phone: newPartner.phone || "+549385000000",
      address: newPartner.address || "Santiago del Estero",
      bio: newPartner.bio || "Socio registrado en ZUMA CRM.",
      logoColor: randomColor,
      joinedDate: new Date().toLocaleDateString("es-AR")
    };

    mockDB.addPartner(created);
    setPartners(mockDB.getPartners());
    setShowAddModal(false);
    setNewPartner({
      name: "",
      category: "Médico Cardiólogo",
      cuit: "",
      email: "",
      phone: "",
      address: "",
      bio: ""
    });
  };

  const filtered = partners.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.category.toLowerCase().includes(search.toLowerCase()) || 
                          p.cuit.includes(search);
    const matchesCategory = categoryFilter === "Todos" || p.category.includes(categoryFilter) || 
                            (categoryFilter === "Salud" && (p.category.includes("Médico") || p.category.includes("Clínica") || p.category.includes("Sanatorio") || p.category.includes("Análisis")));
    return matchesSearch && matchesCategory;
  });

  const activeCount = partners.filter(p => p.status === "active").length;
  const pendingCount = partners.filter(p => p.status === "pending").length;
  const estimatedRevenue = activeCount * 125000; // e.g. ARS 125,000 monthly fee per active member

  return (
    <div className="flex flex-col gap-6 animate-slide-in">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Directorio de Socios</h1>
          <p className="text-xs text-slate-400">Panel administrativo general de cuentas y suscripciones de la plataforma.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Registrar Socio
        </button>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Socios Activos</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{activeCount} / {partners.length}</h3>
            <p className="text-[9px] text-teal-600 font-semibold mt-1">Con suscripción activa al día</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facturación Mensual</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">${estimatedRevenue.toLocaleString("es-AR")}</h3>
            <p className="text-[9px] text-slate-400 font-medium mt-1">Suscripciones recurrentes</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuentas Pendientes</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{pendingCount}</h3>
            <p className="text-[9px] text-amber-600 font-semibold mt-1">Requieren configuración inicial</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Directory filters & search toolbar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre de socio, rubro, CUIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary bg-slate-50/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
          {["Todos", "Salud", "Gimnasio", "Gastronomía", "Otros"].map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0
                ${categoryFilter === category 
                  ? "bg-primary text-white border-primary" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((partner) => {
          return (
            <div 
              key={partner.id} 
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-3">
                  <div className={`w-11 h-11 rounded-xl ${partner.logoColor} text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0`}>
                    {partner.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug">{partner.name}</h3>
                    <span className="text-[10px] text-slate-400 font-medium">{partner.category}</span>
                  </div>
                </div>
                
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border shrink-0
                  ${partner.status === "active" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : ""}
                  ${partner.status === "pending" ? "bg-amber-50 border-amber-200 text-amber-700 animate-pulse" : ""}
                  ${partner.status === "suspended" ? "bg-rose-50 border-rose-200 text-rose-700" : ""}
                `}>
                  {partner.status === "active" && "Activo"}
                  {partner.status === "pending" && "Pendiente"}
                  {partner.status === "suspended" && "Suspendido"}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-normal line-clamp-2">{partner.bio}</p>

              <div className="h-px bg-slate-100" />

              <div className="flex flex-col gap-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>CUIT: {partner.cuit}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{partner.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{partner.phone}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-1">
                <span className="text-[9px] text-slate-400">Alta: {partner.joinedDate}</span>
                <span className="text-xs font-bold text-primary cursor-pointer hover:underline">
                  Ver Ficha &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* REGISTRATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-100 shadow-xl overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-sm">Registrar Nuevo Socio</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Razón Social / Nombre Comercial</label>
                <input
                  type="text"
                  required
                  value={newPartner.name}
                  onChange={(e) => setNewPartner(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ej. Centro Odontológico"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">CUIT / DNI</label>
                  <input
                    type="text"
                    required
                    value={newPartner.cuit}
                    onChange={(e) => setNewPartner(prev => ({ ...prev, cuit: e.target.value }))}
                    placeholder="30-11222333-4"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Rubro / Categoría</label>
                  <select
                    value={newPartner.category}
                    onChange={(e) => setNewPartner(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="Médico Cardiólogo">Médico Cardiólogo</option>
                    <option value="Laboratorio">Laboratorio Clínico</option>
                    <option value="Gimnasio">Gimnasio / Fitness</option>
                    <option value="Gastronomía">Gastronomía</option>
                    <option value="Odontología">Odontología</option>
                    <option value="Profesor Particular">Profesor Particular</option>
                    <option value="Comercio Minorista">Comercio Minorista</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={newPartner.phone}
                    onChange={(e) => setNewPartner(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+549385..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={newPartner.email}
                    onChange={(e) => setNewPartner(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Dirección de Atención</label>
                <input
                  type="text"
                  value={newPartner.address}
                  onChange={(e) => setNewPartner(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Av. Belgrano Sur 100"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Breve Descripción / Bio</label>
                <textarea
                  value={newPartner.bio}
                  onChange={(e) => setNewPartner(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Cuéntanos un poco sobre las actividades del socio..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-teal-600 text-white font-bold py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  Registrar Socio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple X icon replacement since Lucide import failed in preview
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
