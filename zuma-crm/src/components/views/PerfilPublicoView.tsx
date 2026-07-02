"use client";

import { useState, useEffect } from "react";
import { mockDB, Partner, ConsultorioLocation } from "@/lib/mockData";
import { 
  Save, 
  Loader2, 
  CheckCircle, 
  Eye, 
  Info, 
  MapPin, 
  Plus, 
  Trash2, 
  Heart, 
  Activity, 
  Building2, 
  Stethoscope, 
  ExternalLink,
  Phone,
  Compass,
  FileText
} from "lucide-react";

export default function PerfilPublicoView() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states loaded from Mock Partner
  const [nombre, setNombre] = useState("");
  const [especialidadInput, setEspecialidadInput] = useState("");
  const [cuit, setCuit] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("emblem_doctor");
  const [logoColor, setLogoColor] = useState("bg-teal-500");
  
  // Consultorio locations list state
  const [locations, setLocations] = useState<ConsultorioLocation[]>([]);

  // Individual location editor form state
  const [newLocName, setNewLocName] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");
  const [newLocMapsUrl, setNewLocMapsUrl] = useState("");
  const [newLocLine2, setNewLocLine2] = useState("");
  const [newLocPhone, setNewLocPhone] = useState("");
  const [newLocObs, setNewLocObs] = useState("");
  const [newLocImg, setNewLocImg] = useState("emblem_clinic");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const partners = mockDB.getPartners();
    const partner = partners.find(p => p.id === "dr-carlos-jensen");

    if (partner) {
      setNombre(partner.name);
      setEspecialidadInput(partner.specialties ? partner.specialties.join(", ") : "");
      setCuit(partner.cuit);
      setEmail(partner.email);
      setPhone(partner.phone);
      setBio(partner.bio);
      setLogoUrl(partner.logoUrl || "emblem_doctor");
      setLogoColor(partner.logoColor || "bg-teal-500");
      setLocations(partner.locations || []);
    }
  }, []);

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocAddress) return;

    const newLoc: ConsultorioLocation = {
      id: `loc_${Math.random().toString(36).substring(2, 9)}`,
      name: newLocName,
      address: newLocAddress,
      mapsUrl: newLocMapsUrl.trim() || `https://maps.google.com/?q=${encodeURIComponent(newLocAddress)}`,
      line2: newLocLine2,
      phone: newLocPhone,
      observations: newLocObs,
      imageUrl: newLocImg
    };

    setLocations([...locations, newLoc]);
    
    // Reset Form fields
    setNewLocName("");
    setNewLocAddress("");
    setNewLocMapsUrl("");
    setNewLocLine2("");
    setNewLocPhone("");
    setNewLocObs("");
    setNewLocImg("emblem_clinic");
    setShowAddForm(false);
  };

  const handleRemoveLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    // Parse specialties input separated by commas
    const parsedSpecialties = specialtyInputList;

    setTimeout(() => {
      // 1. Sync config structure
      const currentConfig = mockDB.getMedicoConfig();
      mockDB.saveMedicoConfig({
        ...currentConfig,
        nombre,
        especialidad: parsedSpecialties.join(" | ")
      });

      // 2. Save partners database list
      const partners = mockDB.getPartners();
      const idx = partners.findIndex(p => p.id === "dr-carlos-jensen");
      if (idx !== -1) {
        partners[idx] = {
          ...partners[idx],
          name: nombre,
          cuit,
          email,
          phone,
          bio,
          logoColor,
          logoUrl,
          specialties: parsedSpecialties,
          locations: locations
        };
        mockDB.savePartners(partners);
      }

      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }, 800);
  };

  // Convert comma input string to array of tags
  const specialtyInputList = especialidadInput
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const getEmblemIcon = (key: string) => {
    if (key.startsWith("data:image/") || key.startsWith("http")) {
      return <img src={key} alt="Logo" className="w-full h-full object-cover rounded-xl" />;
    }
    if (key === "emblem_doctor") return <Stethoscope className="w-5 h-5" />;
    if (key === "emblem_heart") return <Heart className="w-5 h-5" />;
    if (key === "emblem_cross") return <Activity className="w-5 h-5" />;
    return <Building2 className="w-5 h-5" />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in">
      
      {/* Edit Form */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Mi Perfil Profesional</h1>
          <p className="text-xs text-slate-400 mt-1">Configura las especialidades en etiquetas, direcciones de consultorios, teléfonos de contacto y tu logotipo comercial.</p>
        </div>

        <form onSubmit={handleSave} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-5">
          
          {/* Section 1: Basic Information */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Información Básica</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Nombre Comercial / Profesional</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-primary font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">CUIT / DNI Comercial</label>
                <input
                  type="text"
                  required
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Rubros / Especialidad (Separados por coma)</label>
              <input
                type="text"
                required
                value={especialidadInput}
                onChange={(e) => setEspecialidadInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-primary"
                placeholder="ej. Cardiología clínica, Cardio metabolismo, Arritmias, Chagas"
              />
              
              {/* Dynamic tag badges preview */}
              {specialtyInputList.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {specialtyInputList.map((tag, i) => (
                    <span 
                      key={i} 
                      className="bg-indigo-50 border border-indigo-100 text-[9px] font-bold text-indigo-600 px-2.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Teléfono de Secretaría (WhatsApp)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Email Público de Contacto</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Descripción Profesional (Bio)</label>
              <textarea
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-primary resize-none leading-relaxed"
              />
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Section 2: Logo and Visual Theme Selector */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diseño Visual de Ficha</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Image Uploader widget */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Logotipo de la Ficha (Imagen)</label>
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className={`w-12 h-12 rounded-xl ${logoColor} text-white flex items-center justify-center shadow-sm shrink-0 overflow-hidden relative border border-slate-200/50`}>
                    {getEmblemIcon(logoUrl)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors inline-block text-center text-slate-700 shadow-sm">
                      Subir Imagen
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLogoUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setLogoUrl("emblem_doctor")}
                      className="text-[8px] text-slate-400 hover:text-slate-600 underline text-left"
                    >
                      Restablecer por Defecto
                    </button>
                  </div>
                </div>
              </div>

              {/* Color Theme Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Color de Fondo del Logo</label>
                <div className="flex gap-3 h-10 items-center">
                  {[
                    { key: "bg-teal-500", color: "bg-teal-500" },
                    { key: "bg-blue-500", color: "bg-blue-500" },
                    { key: "bg-indigo-500", color: "bg-indigo-500" },
                    { key: "bg-rose-500", color: "bg-rose-500" },
                    { key: "bg-emerald-500", color: "bg-emerald-500" }
                  ].map((colorItem) => (
                    <button
                      key={colorItem.key}
                      type="button"
                      onClick={() => setLogoColor(colorItem.key)}
                      className={`w-6 h-6 rounded-full ${colorItem.color} ring-offset-2 transition-all cursor-pointer
                        ${logoColor === colorItem.key ? "ring-2 ring-slate-800 scale-110" : "opacity-80"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Section 3: Direcciones de Atención (Address Repeater) */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direcciones de Atención</h3>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddForm ? "Cerrar Formulario" : "Agregar Dirección"}
              </button>
            </div>

            {/* Address Form Drawer */}
            {showAddForm && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-3 animate-slide-in">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Nuevo Consultorio / Sede</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nombre de Sede (ej: Consultorio Belgrano)"
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Dirección Física (ej: Belgrano 1200)"
                    value={newLocAddress}
                    onChange={(e) => setNewLocAddress(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Link Google Maps (Opcional)"
                    value={newLocMapsUrl}
                    onChange={(e) => setNewLocMapsUrl(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Piso, Oficina, N° de Consultorio"
                    value={newLocLine2}
                    onChange={(e) => setNewLocLine2(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono exclusivo de la Sede"
                    value={newLocPhone}
                    onChange={(e) => setNewLocPhone(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <select
                    value={newLocImg}
                    onChange={(e) => setNewLocImg(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="emblem_clinic">Imagen: Fachada Clínica</option>
                    <option value="emblem_heart">Imagen: Corazón Sanitario</option>
                    <option value="emblem_cross">Imagen: Cruz Médica</option>
                  </select>
                  <textarea
                    placeholder="Observaciones de atención (ej. Estacionamiento privado)"
                    value={newLocObs}
                    onChange={(e) => setNewLocObs(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs sm:col-span-2 resize-none"
                    rows={2}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddLocation}
                  disabled={!newLocName || !newLocAddress}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-1.5 rounded-lg text-[10px] shadow cursor-pointer self-end px-4"
                >
                  Agregar Sede
                </button>
              </div>
            )}

            {/* Locations List */}
            {locations.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">No hay direcciones configuradas. Agrega al menos una para que el paciente pueda reservar.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {locations.map((loc) => (
                  <div 
                    key={loc.id}
                    className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex justify-between items-center gap-4 hover:border-slate-200 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-700 text-xs truncate">{loc.name}</span>
                        {loc.mapsUrl && (
                          <a href={loc.mapsUrl} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-700">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{loc.address} {loc.line2 && `(${loc.line2})`}</p>
                      {loc.phone && <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {loc.phone}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(loc.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-slate-100 mt-2" />

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-shake">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>¡Perfil comercial guardado y actualizado con éxito!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando cambios...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </form>
      </div>

      {/* Live Preview Card */}
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
            <Eye className="w-4.5 h-4.5 text-slate-500" />
            Vista Previa de Ficha
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Así verán tu consultorio / negocio los usuarios.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 sticky top-6">
          
          <div className="flex justify-between items-start gap-4">
            <div className="flex gap-3">
              <div className={`w-11 h-11 rounded-xl ${logoColor} text-white flex items-center justify-center shadow-sm shrink-0`}>
                {getEmblemIcon(logoUrl)}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm leading-snug">{nombre || "Tu Razón Social"}</h3>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Médico Cardiólogo</span>
              </div>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border bg-emerald-50 border-emerald-200 text-emerald-700 shrink-0">
              Activo
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-normal line-clamp-3">{bio || "Introduce una breve biografía para mostrarla aquí..."}</p>

          {/* Specialties preview */}
          {specialtyInputList.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {specialtyInputList.map((tag, i) => (
                <span 
                  key={i} 
                  className="bg-slate-50 border border-slate-100 text-[8px] font-bold text-slate-500 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="h-px bg-slate-100" />

          {/* List of consultorios preview */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Direcciones de Atención:</span>
            {locations.length === 0 ? (
              <span className="text-[10px] text-slate-400 italic">No hay direcciones configuradas.</span>
            ) : (
              <div className="flex flex-col gap-2">
                {locations.map((loc) => (
                  <div key={loc.id} className="text-[11px] text-slate-500 bg-slate-50/50 border border-slate-100 p-2 rounded-lg flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-700 text-[10px]">{loc.name}</span>
                        {loc.mapsUrl && (
                          <a href={loc.mapsUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 truncate">{loc.address}</p>
                      {loc.line2 && <p className="text-[8px] text-slate-400 font-mono mt-0.5">{loc.line2}</p>}
                      {loc.observations && (
                        <p className="text-[8px] text-amber-600 font-medium bg-amber-50 border border-amber-100/50 rounded px-1 mt-1 leading-normal">
                          Nota: {loc.observations}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-slate-100" />

          <div className="flex flex-col gap-1 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-400 text-[10px]">CUIT:</span>
              <span>{cuit || "20-XXXXXXXX-X"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-400 text-[10px]">TEL:</span>
              <span>{phone || "WhatsApp"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-400 text-[10px]">EMAIL:</span>
              <span className="truncate">{email || "Email de contacto"}</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
