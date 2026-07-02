"use client";

import { useState, useEffect } from "react";
import { mockDB, Partner, ConsultorioLocation } from "@/lib/mockData";
import { 
  MapPin, 
  ExternalLink, 
  Phone, 
  Calendar, 
  Search, 
  Building2, 
  Compass,
  ArrowRight
} from "lucide-react";

interface LocationItem {
  partnerId: string;
  partnerName: string;
  partnerCategory: string;
  partnerLogoColor: string;
  location: ConsultorioLocation;
}

interface PacienteUbicacionesViewProps {
  onSelectLocation: (partnerId: string, locationName: string) => void;
}

export default function PacienteUbicacionesView({ onSelectLocation }: PacienteUbicacionesViewProps) {
  const [locationsList, setLocationsList] = useState<LocationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  useEffect(() => {
    const partners = mockDB.getPartners().filter(p => p.status === "active");
    const compiled: LocationItem[] = [];

    partners.forEach(p => {
      if (p.locations && p.locations.length > 0) {
        p.locations.forEach(loc => {
          compiled.push({
            partnerId: p.id,
            partnerName: p.name,
            partnerCategory: p.category,
            partnerLogoColor: p.logoColor || "bg-indigo-500",
            location: loc
          });
        });
      }
    });

    setLocationsList(compiled);
  }, []);

  const categories = [
    "Todos",
    "Clínicas",
    "Restaurantes",
    "Gimnasios",
    "Profesionales",
    "Otros"
  ];

  const filtered = locationsList.filter(item => {
    const matchesSearch = 
      item.location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partnerName.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedCategory === "Todos") return matchesSearch;
    if (selectedCategory === "Otros") {
      const cat = item.partnerCategory.toLowerCase();
      return matchesSearch && !cat.includes("clínica") && !cat.includes("clinica") && !cat.includes("restaurante") && !cat.includes("gastronomía") && !cat.includes("gimnasio") && !cat.includes("profesional");
    }

    const catLower = item.partnerCategory.toLowerCase();
    const filterLower = selectedCategory.toLowerCase();
    
    if (selectedCategory === "Clínicas") return matchesSearch && (catLower.includes("clínica") || catLower.includes("clinica") || catLower.includes("sanatorio"));
    if (selectedCategory === "Restaurantes") return matchesSearch && (catLower.includes("restaurante") || catLower.includes("gastronomía") || catLower.includes("bar") || catLower.includes("cervecería"));
    if (selectedCategory === "Gimnasios") return matchesSearch && (catLower.includes("gimnasio") || catLower.includes("fitness"));
    if (selectedCategory === "Profesionales") return matchesSearch && (catLower.includes("profesional") || catLower.includes("médico") || catLower.includes("cardiólogo") || catLower.includes("odontólogo") || catLower.includes("dentista"));

    return false;
  });

  return (
    <div className="flex flex-col gap-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Direcciones y Ubicaciones</h1>
        <p className="text-xs text-slate-400 mt-1">Explora las sedes físicas, consultorios, sucursales y locales asociados en ZUMA.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        {/* Category filters */}
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer
                  ${isActive 
                    ? "bg-[#0f172a] text-white shadow-sm" 
                    : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"}`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por sede o calle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500/50 text-slate-700 placeholder-slate-400 font-semibold"
          />
        </div>
      </div>

      {/* Locations grid list */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center shadow-sm flex flex-col items-center gap-2">
          <Compass className="w-8 h-8 text-slate-300" />
          <span className="font-semibold text-slate-700 text-xs">No se encontraron ubicaciones</span>
          <p className="text-[10px] text-slate-400">Intenta buscando con otro término o modificando los filtros superiores.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item, idx) => (
            <div 
              key={`${item.partnerId}_${item.location.id}_${idx}`}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs leading-snug">{item.location.name}</h3>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5 uppercase tracking-wide">
                      {item.partnerName}
                    </span>
                  </div>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full text-white ${item.partnerLogoColor}`}>
                    {item.partnerCategory}
                  </span>
                </div>

                <div className="h-px bg-slate-100 my-3" />

                <div className="flex flex-col gap-2 text-xs text-slate-500">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-700 leading-normal text-[11px]">{item.location.address}</p>
                      {item.location.line2 && (
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{item.location.line2}</p>
                      )}
                    </div>
                  </div>

                  {item.location.phone && (
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{item.location.phone}</span>
                    </div>
                  )}

                  {item.location.observations && (
                    <div className="mt-1 p-2 bg-amber-50/50 border border-amber-100 rounded-lg text-[9px] text-amber-800 leading-relaxed font-medium">
                      {item.location.observations}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                {item.location.mapsUrl && (
                  <a 
                    href={item.location.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 border border-slate-200 hover:border-slate-350 text-[10px] font-bold text-slate-600 rounded-xl flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors"
                  >
                    Cómo Llegar
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
                
                <button
                  type="button"
                  onClick={() => onSelectLocation(item.partnerId, item.location.name)}
                  className="flex-1 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  Reservar
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
