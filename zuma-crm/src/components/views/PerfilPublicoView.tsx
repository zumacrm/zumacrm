"use client";

import { useState, useEffect } from "react";
import { mockDB } from "@/lib/mockData";
import { Save, Loader2, CheckCircle, Eye, Info, HelpCircle } from "lucide-react";

export default function PerfilPublicoView() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states loaded from Mock Medico Config
  const [nombre, setNombre] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [cuit, setCuit] = useState("20-35123456-9");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [theme, setTheme] = useState("bg-teal-500 text-teal-600 border-teal-200");

  useEffect(() => {
    // Load config from mock db
    const config = mockDB.getMedicoConfig();
    const partners = mockDB.getPartners();
    const partner = partners.find(p => p.id === "dr-carlos-jensen");

    if (config) {
      setNombre(config.nombre);
      setEspecialidad(config.especialidad);
    }
    if (partner) {
      setCuit(partner.cuit);
      setEmail(partner.email);
      setPhone(partner.phone);
      setAddress(partner.address);
      setBio(partner.bio);
      if (partner.logoColor === "bg-blue-500") {
        setTheme("bg-blue-500 text-blue-600 border-blue-200");
      } else if (partner.logoColor === "bg-indigo-500") {
        setTheme("bg-indigo-500 text-indigo-600 border-indigo-200");
      } else {
        setTheme("bg-teal-500 text-teal-600 border-teal-200");
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    setTimeout(() => {
      // Save config to mockDB
      const currentConfig = mockDB.getMedicoConfig();
      mockDB.saveMedicoConfig({
        ...currentConfig,
        nombre,
        especialidad
      });

      // Update in partner DB
      const partners = mockDB.getPartners();
      const idx = partners.findIndex(p => p.id === "dr-carlos-jensen");
      if (idx !== -1) {
        partners[idx] = {
          ...partners[idx],
          name: nombre,
          cuit,
          email,
          phone,
          address,
          bio,
          logoColor: theme.split(" ")[0] // extract 'bg-teal-500' etc
        };
        mockDB.saveTurnos(mockDB.getTurnos()); // mock sync trigger
        localStorage.setItem("zuma_partners", JSON.stringify(partners));
      }

      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    }, 800);
  };

  const getLogoColorClass = () => theme.split(" ")[0];
  const getTextColorClass = () => theme.split(" ")[1];
  const getBorderColorClass = () => theme.split(" ")[2];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in">
      
      {/* Edit Form */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Mi Perfil Público</h1>
          <p className="text-xs text-slate-400">Modifica los datos comerciales que tus clientes o pacientes verán en la plataforma y buscadores.</p>
        </div>

        <form onSubmit={handleSave} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Nombre Comercial / Profesional</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">DNI / CUIT</label>
              <input
                type="text"
                required
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Rubros / Especialidad</label>
            <input
              type="text"
              required
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
              placeholder="ej. Cardiología clínica | Cardio metabolismo"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">WhatsApp de contacto</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Público</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Dirección / Sedes de Atención</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Descripción / Bio Profesional</label>
            <textarea
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary resize-none leading-relaxed"
            />
          </div>

          {/* Theme colors */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Tema Visual / Color de Logotipo</label>
            <div className="flex gap-3">
              {[
                { id: "bg-teal-500 text-teal-600 border-teal-200", color: "bg-teal-500" },
                { id: "bg-blue-500 text-blue-600 border-blue-200", color: "bg-blue-500" },
                { id: "bg-indigo-500 text-indigo-600 border-indigo-200", color: "bg-indigo-500" }
              ].map((themeItem) => (
                <button
                  key={themeItem.id}
                  type="button"
                  onClick={() => setTheme(themeItem.id)}
                  className={`w-6 h-6 rounded-full ${themeItem.color} ring-offset-2 transition-all cursor-pointer
                    ${theme === themeItem.id ? "ring-2 ring-slate-800" : "opacity-80"}`}
                />
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100 my-1" />

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-shake">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>¡Perfil público guardado y actualizado con éxito!</span>
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

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4 sticky top-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex gap-3">
              <div className={`w-11 h-11 rounded-xl ${getLogoColorClass()} text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0`}>
                {nombre ? nombre.substring(0, 2).toUpperCase() : "ZU"}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm leading-snug">{nombre || "Tu Razón Social"}</h3>
                <span className="text-[10px] text-slate-400 font-medium">{especialidad || "Rubros / Especialidad"}</span>
              </div>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border bg-emerald-50 border-emerald-200 text-emerald-700 shrink-0">
              Activo
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-normal line-clamp-3">{bio || "Introduce una breve biografía para mostrarla aquí..."}</p>

          <div className="h-px bg-slate-100" />

          <div className="flex flex-col gap-1 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-400 text-[10px]">CUIT:</span>
              <span>{cuit || "20-XXXXXXXX-X"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-400 text-[10px]">LUGAR:</span>
              <span className="truncate">{address || "Dirección comercial"}</span>
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

          <div className="h-px bg-slate-100" />

          <div className="flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-400">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p>Los cambios en esta sección se replican en el portal público de reserva de turnos del cliente de inmediato.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
