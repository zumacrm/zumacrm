"use client";

import { useState, useEffect } from "react";
import { mockDB, Partner, GlobalSaaSConfig } from "@/lib/mockData";
import { 
  Percent, 
  DollarSign, 
  Settings, 
  Users, 
  CheckCircle2, 
  Sliders, 
  Edit3, 
  X, 
  Check,
  Undo2
} from "lucide-react";

export default function SaaSConfigView() {
  const [globalConfig, setGlobalConfig] = useState<GlobalSaaSConfig>({
    globalCommission: 10,
    bronzePrice: 29,
    goldPrice: 59,
    platinumPrice: 99
  });
  const [partners, setPartners] = useState<Partner[]>([]);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  
  // Custom socio fields being edited
  const [editPlan, setEditPlan] = useState<"bronze" | "gold" | "platinum">("gold");
  const [editFee, setEditFee] = useState<string>("");
  const [editComm, setEditComm] = useState<string>("");

  const [showGlobalSuccess, setShowGlobalSuccess] = useState(false);
  const [showPartnerSuccess, setShowPartnerSuccess] = useState(false);

  const loadData = () => {
    setGlobalConfig(mockDB.getSaaSConfig());
    setPartners(mockDB.getPartners());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    mockDB.saveSaaSConfig(globalConfig);
    setShowGlobalSuccess(true);
    setTimeout(() => setShowGlobalSuccess(false), 2000);
    loadData();
  };

  const handleStartEdit = (p: Partner) => {
    setEditingPartnerId(p.id);
    setEditPlan(p.subscriptionPlan);
    setEditFee(p.customMonthlyFee !== null ? p.customMonthlyFee.toString() : "");
    setEditComm(p.customCommissionPercentage !== null ? p.customCommissionPercentage.toString() : "");
  };

  const handleSavePartnerOverride = (partnerId: string) => {
    const list = [...partners];
    const idx = list.findIndex(p => p.id === partnerId);
    if (idx !== -1) {
      list[idx].subscriptionPlan = editPlan;
      list[idx].customMonthlyFee = editFee.trim() !== "" ? Number(editFee) : null;
      list[idx].customCommissionPercentage = editComm.trim() !== "" ? Number(editComm) : null;
      
      mockDB.savePartners(list);
      setShowPartnerSuccess(true);
      setTimeout(() => setShowPartnerSuccess(false), 2000);
      setEditingPartnerId(null);
      loadData();
    }
  };

  const handleResetPartnerOverride = (partnerId: string) => {
    const list = [...partners];
    const idx = list.findIndex(p => p.id === partnerId);
    if (idx !== -1) {
      list[idx].customMonthlyFee = null;
      list[idx].customCommissionPercentage = null;
      mockDB.savePartners(list);
      loadData();
    }
  };

  const getPlanCost = (p: Partner) => {
    if (p.customMonthlyFee !== null) return p.customMonthlyFee;
    if (p.subscriptionPlan === "bronze") return globalConfig.bronzePrice;
    if (p.subscriptionPlan === "gold") return globalConfig.goldPrice;
    return globalConfig.platinumPrice;
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-in">
      
      {/* Overview header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-sm">
          <Settings className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 leading-none">Configuración de Parámetros SaaS</h2>
          <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">Configura suscripciones, comisiones globales y excepciones por socio comercial.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left column: Global Config Form */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-indigo-500" />
            Condiciones Globales
          </h3>

          <form onSubmit={handleSaveGlobal} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-slate-400" />
                Comisión sobre Señas (%)
              </label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={globalConfig.globalCommission}
                onChange={(e) => setGlobalConfig({ ...globalConfig, globalCommission: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500/50"
              />
            </div>

            <div className="h-px bg-slate-100 my-1" />

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Suscripción Plan Bronce (USD)
              </label>
              <input
                type="number"
                required
                min="0"
                value={globalConfig.bronzePrice}
                onChange={(e) => setGlobalConfig({ ...globalConfig, bronzePrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Suscripción Plan Oro (USD)
              </label>
              <input
                type="number"
                required
                min="0"
                value={globalConfig.goldPrice}
                onChange={(e) => setGlobalConfig({ ...globalConfig, goldPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Suscripción Plan Platino (USD)
              </label>
              <input
                type="number"
                required
                min="0"
                value={globalConfig.platinumPrice}
                onChange={(e) => setGlobalConfig({ ...globalConfig, platinumPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500/50"
              />
            </div>

            <div className="flex justify-between items-center mt-2">
              {showGlobalSuccess && (
                <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Guardado
                </span>
              )}
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs shadow transition-all cursor-pointer"
              >
                Actualizar Precios Globales
              </button>
            </div>

          </form>
        </div>

        {/* Right column: Partners Customize table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Users className="w-4 h-4 text-teal-500" />
            Condiciones Especiales por Socio
          </h3>

          {showPartnerSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-xl text-xs font-semibold animate-fade-in">
              Condición personalizada guardada exitosamente.
            </div>
          )}

          <div className="flex flex-col gap-4">
            {partners.map((p) => {
              const isEditing = editingPartnerId === p.id;
              const hasFeeOverride = p.customMonthlyFee !== null;
              const hasCommOverride = p.customCommissionPercentage !== null;
              
              return (
                <div 
                  key={p.id}
                  className={`border rounded-xl p-4 transition-all flex flex-col gap-3.5
                    ${isEditing ? "border-indigo-500 bg-slate-50/50 shadow-sm" : "border-slate-100 bg-white"}`}
                >
                  {/* Partner Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs leading-snug">{p.name}</h4>
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                        Categoría: {p.category} &bull; CUIT: {p.cuit}
                      </span>
                    </div>

                    {!isEditing && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-lg cursor-pointer transition-colors"
                          title="Personalizar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {(hasFeeOverride || hasCommOverride) && (
                          <button
                            onClick={() => handleResetPartnerOverride(p.id)}
                            className="p-1.5 bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-lg cursor-pointer transition-colors"
                            title="Restablecer"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pricing override detail */}
                  {!isEditing ? (
                    <div className="grid grid-cols-3 gap-3 text-center bg-slate-50/50 border border-slate-100 rounded-lg p-2.5">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Plan Suscripto</span>
                        <span className="text-xs font-bold text-slate-700 capitalize mt-0.5">{p.subscriptionPlan}</span>
                      </div>
                      <div className="flex flex-col border-x border-slate-100">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Abono Mensual</span>
                        <span className={`text-xs font-bold mt-0.5 ${hasFeeOverride ? "text-indigo-600" : "text-slate-700"}`}>
                          ${getPlanCost(p)}/mes {hasFeeOverride && <span className="text-[8px] block font-medium font-mono text-indigo-400">(Personalizado)</span>}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Comisión Turnos</span>
                        <span className={`text-xs font-bold mt-0.5 ${hasCommOverride ? "text-indigo-600" : "text-slate-700"}`}>
                          {p.customCommissionPercentage !== null ? p.customCommissionPercentage : globalConfig.globalCommission}% 
                          {hasCommOverride && <span className="text-[8px] block font-medium font-mono text-indigo-400">(Personalizada)</span>}
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Editing Form block
                    <div className="flex flex-col gap-4 border-t border-slate-200/60 pt-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Plan selection */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Plan</label>
                          <select
                            value={editPlan}
                            onChange={(e) => setEditPlan(e.target.value as any)}
                            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                          >
                            <option value="bronze">Bronce</option>
                            <option value="gold">Oro</option>
                            <option value="platinum">Platino</option>
                          </select>
                        </div>

                        {/* Custom Monthly Fee input */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Abono Mensual (USD)</label>
                          <input
                            type="number"
                            placeholder="Usar default"
                            value={editFee}
                            onChange={(e) => setEditFee(e.target.value)}
                            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                          />
                        </div>

                        {/* Custom Commission input */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Comisión (%)</label>
                          <input
                            type="number"
                            placeholder="Usar default"
                            value={editComm}
                            onChange={(e) => setEditComm(e.target.value)}
                            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Editing Actions */}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingPartnerId(null)}
                          className="px-3 py-1 border border-slate-200 text-slate-400 hover:bg-slate-100 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 inline mr-0.5" /> Cancelar
                        </button>
                        <button
                          onClick={() => handleSavePartnerOverride(p.id)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold shadow cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 inline mr-0.5" /> Guardar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
