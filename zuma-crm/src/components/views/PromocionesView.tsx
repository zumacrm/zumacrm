"use client";

import { useState, useEffect } from "react";
import { mockDB, MockCoupon, Partner } from "@/lib/mockData";
import { 
  Tag, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Percent, 
  DollarSign, 
  Copy, 
  Check, 
  Ticket, 
  ShieldAlert,
  Info,
  Gift
} from "lucide-react";

interface PromocionesViewProps {
  role?: "superadmin" | "partner" | "patient_guest" | "patient_registered";
  partnerId?: string;
}

export default function PromocionesView({ role = "partner", partnerId = "dr-carlos-jensen" }: PromocionesViewProps) {
  const [coupons, setCoupons] = useState<MockCoupon[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New coupon form states
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState<number>(10);
  const [description, setDescription] = useState("");

  const loadCoupons = () => {
    setCoupons(mockDB.getCoupons());
    setPartners(mockDB.getPartners());
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    const formattedCode = code.trim().toUpperCase().replace(/\s+/g, "");
    const newCoupon: MockCoupon = {
      code: formattedCode,
      type,
      value,
      partnerId,
      isActive: true,
      description: description || `Descuento de ${type === "percentage" ? `${value}%` : `$${value}`} activo.`
    };

    mockDB.addCoupon(newCoupon);
    setSuccessMsg(`Cupón "${formattedCode}" creado exitosamente.`);
    
    // Clear form
    setCode("");
    setValue(type === "percentage" ? 10 : 1000);
    setDescription("");

    setTimeout(() => setSuccessMsg(null), 2500);
    loadCoupons();
  };

  const handleToggleStatus = (couponCode: string) => {
    const list = mockDB.getCoupons();
    const idx = list.findIndex(c => c.code === couponCode && c.partnerId === partnerId);
    if (idx !== -1) {
      list[idx].isActive = !list[idx].isActive;
      mockDB.saveCoupons(list);
      loadCoupons();
    }
  };

  const handleDeleteCoupon = (couponCode: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el cupón "${couponCode}"?`)) {
      const list = mockDB.getCoupons();
      const filtered = list.filter(c => !(c.code === couponCode && c.partnerId === partnerId));
      mockDB.saveCoupons(filtered);
      loadCoupons();
    }
  };

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(codeText);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  // Filter lists based on role
  const myCoupons = coupons.filter(c => c.partnerId === partnerId);
  const activeGlobalCoupons = coupons.filter(c => c.isActive);

  // RENDER PARTNER VIEW
  if (role === "partner") {
    return (
      <div className="flex flex-col gap-6 animate-slide-in">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Diseñador de Cupones</h1>
          <p className="text-xs text-slate-400 mt-1">Crea códigos promocionales de descuento fijos o porcentuales para tus clientes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Coupon Designer Form */}
          <form onSubmit={handleCreateCoupon} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Plus className="w-4 h-4 text-primary" />
              Nuevo Código Promocional
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código del Cupón</label>
              <input
                type="text"
                required
                placeholder="Ej: BIENVENIDA20"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-bold uppercase placeholder:normal-case"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Descuento</label>
                <select
                  value={type}
                  onChange={(e) => {
                    const newType = e.target.value as "percentage" | "fixed";
                    setType(newType);
                    setValue(newType === "percentage" ? 10 : 2000);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="percentage">Porcentual (%)</option>
                  <option value="fixed">Monto Fijo ($)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monto de Descuento</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={value}
                    onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-semibold text-slate-750"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-450 font-bold">
                    {type === "percentage" ? "%" : "ARS"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción del Beneficio</label>
              <textarea
                placeholder="Ej: 10% de descuento en el total de tu reserva médica"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 animate-bounce" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Tag className="w-4 h-4" />
              Crear y Activar Cupón
            </button>
          </form>

          {/* Coupons List */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Ticket className="w-4.5 h-4.5 text-primary" />
              Códigos de Descuento Activos ({myCoupons.length})
            </h2>

            {myCoupons.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-2.5 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Info className="w-8 h-8 text-slate-350" />
                <span className="font-semibold text-slate-700 text-xs">No has creado ningún cupón promocional</span>
                <p className="text-[10px] text-slate-400">Diseña tu primer descuento a la izquierda para captar nuevos clientes.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myCoupons.map((coupon) => (
                  <div key={coupon.code} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-150 rounded-2xl hover:border-slate-300 transition-all gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        {coupon.type === "percentage" ? <Percent className="w-4.5 h-4.5" /> : <DollarSign className="w-4.5 h-4.5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-xs tracking-wider">{coupon.code}</span>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded
                            ${coupon.isActive ? "bg-emerald-50 border border-emerald-150 text-emerald-700" : "bg-slate-200 border-slate-300 text-slate-500"}`}
                          >
                            {coupon.isActive ? "Activo" : "Pausado"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">{coupon.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs font-extrabold text-slate-800">
                          {coupon.type === "percentage" ? `${coupon.value}%` : `$${coupon.value.toLocaleString("es-AR")} ARS`}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Valor de descuento</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Toggle active switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(coupon.code)}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer
                            ${coupon.isActive 
                              ? "bg-amber-50 border-amber-250 text-amber-700 hover:bg-amber-100" 
                              : "bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100"}`}
                        >
                          {coupon.isActive ? "Pausar" : "Reactivar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(coupon.code)}
                          className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // RENDER CLIENT VIEW
  return (
    <div className="flex flex-col gap-6 animate-slide-in max-w-4xl mx-auto">
      <div className="text-center sm:text-left">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Promociones y Ofertas</h1>
        <p className="text-xs text-slate-400 mt-1">Encuentra y copia códigos de descuento exclusivos para usar en tus reservas en línea.</p>
      </div>

      {activeGlobalCoupons.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-3">
          <Gift className="w-12 h-12 text-slate-300 stroke-[1.2] animate-pulse" />
          <h3 className="font-semibold text-slate-700 text-xs">No hay cupones activos hoy</h3>
          <p className="text-[10px] text-slate-400 max-w-sm leading-relaxed">
            Los comercios adheridos publicarán códigos de descuento pronto. ¡Vuelve a consultar antes de confirmar tu reserva!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeGlobalCoupons.map((coupon) => {
            const partnerObj = partners.find(p => p.id === coupon.partnerId);
            const partnerName = partnerObj ? partnerObj.name : "Comercio Asociado";
            const colorCode = partnerObj ? partnerObj.logoColor : "bg-indigo-650";
            
            return (
              <div key={coupon.code} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between gap-4">
                {/* Visual badge top right */}
                <span className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/20 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-xs shrink-0 ${colorCode}`}>
                    {partnerName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs leading-none">{partnerName}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Ofrece el código de descuento:</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">Código de Descuento</span>
                    <span className="text-sm font-extrabold text-indigo-700 tracking-wider font-mono uppercase">{coupon.code}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(coupon.code)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1
                      ${copiedCode === coupon.code 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : "bg-white border border-slate-250 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {copiedCode === coupon.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode === coupon.code ? "Copiado" : "Copiar"}
                  </button>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{coupon.description}</p>
                  <div className="h-px bg-slate-100 my-3" />
                  <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className="text-slate-450 uppercase tracking-wide">Beneficio</span>
                    <span className="text-indigo-650 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100">
                      {coupon.type === "percentage" ? `${coupon.value}% de ahorro` : `$${coupon.value.toLocaleString("es-AR")} ARS de regalo`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
