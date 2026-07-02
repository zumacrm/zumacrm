"use client";

import { useState, useEffect } from "react";
import { mockDB, Partner } from "@/lib/mockData";
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  Heart, 
  Activity, 
  Building2, 
  Sparkles,
  Stethoscope
} from "lucide-react";

interface PacienteDashboardViewProps {
  onSelectPartner: (partnerId: string) => void;
}

export default function PacienteDashboardView({ onSelectPartner }: PacienteDashboardViewProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Only display active partners
    const activeOnes = mockDB.getPartners().filter(p => p.status === "active");
    setPartners(activeOnes);
  }, []);

  const categories = [
    "Todos",
    "Cardiología",
    "Clínicas",
    "Laboratorios",
    "Gimnasio y Fitness"
  ];

  // Helper to render beautiful category logos
  const renderEmblem = (logoUrl: string | null, color: string) => {
    const base = "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 overflow-hidden";
    if (logoUrl && (logoUrl.startsWith("data:image/") || logoUrl.startsWith("http"))) {
      return (
        <div className={`${base} ${color}`}>
          <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
        </div>
      );
    }
    if (logoUrl === "emblem_doctor") {
      return <div className={`${base} ${color}`}><Stethoscope className="w-5 h-5" /></div>;
    }
    if (logoUrl === "emblem_heart") {
      return <div className={`${base} ${color}`}><Heart className="w-5 h-5" /></div>;
    }
    if (logoUrl === "emblem_cross") {
      return <div className={`${base} ${color}`}><Activity className="w-5 h-5" /></div>;
    }
    // Default emblem_clinic
    return <div className={`${base} ${color}`}><Building2 className="w-5 h-5" /></div>;
  };

  // Filter partners list
  const filtered = partners.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (selectedCategory === "Todos") return matchesSearch;
    
    // Category mapping filters
    const catLower = p.category.toLowerCase();
    if (selectedCategory === "Cardiología" && (catLower.includes("cardiólogo") || catLower.includes("cardiología"))) return matchesSearch;
    if (selectedCategory === "Clínicas" && (catLower.includes("clínica") || catLower.includes("sanatorio"))) return matchesSearch;
    if (selectedCategory === "Laboratorios" && catLower.includes("análisis")) return matchesSearch;
    if (selectedCategory === "Gimnasio y Fitness" && catLower.includes("gimnasio")) return matchesSearch;
    
    return false;
  });

  return (
    <div className="flex flex-col gap-6 animate-slide-in">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[9px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Portal de Pacientes
          </span>
          <h2 className="text-xl font-bold font-display mt-2">¿Con quién deseas reservar tu turno hoy?</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
            Busca profesionales, laboratorios de diagnóstico y centros deportivos asociados a ZUMA. Reserva tu cita en segundos.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs backdrop-blur-sm shadow-inner shrink-0">
          <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="font-semibold text-slate-200">Anti No-Show Active</span>
        </div>
      </div>

      {/* Directory filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        
        {/* Category switcher */}
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap border transition-all cursor-pointer
                  ${isActive 
                    ? "bg-slate-800 border-slate-800 text-white shadow-sm" 
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar especialidad o profesional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 shadow-sm"
          />
        </div>
      </div>

      {/* Partners Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs shadow-sm">
          No se encontraron prestadores cargados en esta categoría con el filtro seleccionado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <div 
              key={p.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex gap-3.5 items-start">
                  {renderEmblem(p.logoUrl, p.logoColor)}
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm leading-snug">{p.name}</h3>
                    <span className="text-[10px] font-bold text-indigo-600 block mt-0.5">{p.category}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mt-3">
                  {p.bio}
                </p>

                {/* Specialties tags list */}
                {p.specialties && p.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3.5">
                    {p.specialties.slice(0, 4).map((spec, i) => (
                      <span 
                        key={i} 
                        className="bg-slate-50 border border-slate-100 text-[9px] font-semibold text-slate-500 px-2 py-0.5 rounded"
                      >
                        {spec}
                      </span>
                    ))}
                    {p.specialties.length > 4 && (
                      <span className="text-[9px] font-bold text-slate-400 px-1 py-0.5">
                        +{p.specialties.length - 4} más
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-slate-100 mt-2" />

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {p.locations?.length || 1} consultorios
                </span>

                <button
                  onClick={() => onSelectPartner(p.id)}
                  className="bg-primary hover:bg-teal-600 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-all"
                >
                  Reservar Turno
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
