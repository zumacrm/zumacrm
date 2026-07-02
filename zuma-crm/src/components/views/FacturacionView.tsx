"use client";

import { useState, useEffect } from "react";
import { mockDB, Partner, GlobalSaaSConfig, MockTurno } from "@/lib/mockData";
import { 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowUpRight,
  TrendingUp,
  Percent,
  Layers,
  Users,
  Info
} from "lucide-react";

interface FacturacionViewProps {
  role?: "superadmin" | "partner" | "patient_guest" | "patient_registered";
}

export default function FacturacionView({ role = "partner" }: FacturacionViewProps) {
  const [globalConfig, setGlobalConfig] = useState<GlobalSaaSConfig>({
    globalCommission: 10,
    bronzePrice: 29,
    goldPrice: 59,
    platinumPrice: 99
  });
  const [partners, setPartners] = useState<Partner[]>([]);
  const [turnos, setTurnos] = useState<MockTurno[]>([]);

  useEffect(() => {
    setGlobalConfig(mockDB.getSaaSConfig());
    setPartners(mockDB.getPartners());
    setTurnos(mockDB.getTurnos());
  }, []);

  const getPartnerPlanCost = (p: Partner) => {
    if (p.customMonthlyFee !== null) return p.customMonthlyFee;
    if (p.subscriptionPlan === "bronze") return globalConfig.bronzePrice;
    if (p.subscriptionPlan === "gold") return globalConfig.goldPrice;
    return globalConfig.platinumPrice;
  };

  const getPartnerCommission = (p: Partner) => {
    if (p.customCommissionPercentage !== null) return p.customCommissionPercentage;
    return globalConfig.globalCommission;
  };

  // 1. Calculations for SuperAdmin view
  const activePartnersCount = partners.filter(p => p.status === "active").length;
  
  // Calculate total monthly recurring revenue (MRR)
  const totalMRR = partners
    .filter(p => p.status === "active")
    .reduce((sum, p) => sum + getPartnerPlanCost(p), 0);

  // Calculate total commissions collected from payments (confirmed/atendido turnos)
  const totalCommissionsCollected = turnos
    .filter(t => t.estado_turno === "CONFIRMADO" || t.estado_turno === "ATENDIDO")
    .reduce((sum, t) => {
      // Find matching partner to see if they have custom commission rates
      const p = partners.find(part => part.id === "dr-carlos-jensen"); // mock lookup matching carlos
      const commRate = p ? getPartnerCommission(p) : globalConfig.globalCommission;
      const paidSeña = t.pago?.monto_pagado || 0;
      return sum + (paidSeña * commRate) / 100;
    }, 0);

  // 2. Specific Partner details (Carlos Jensen by default)
  const myPartnerProfile = partners.find(p => p.id === "dr-carlos-jensen");
  const myPlan = myPartnerProfile?.subscriptionPlan || "gold";
  const myCost = myPartnerProfile ? getPartnerPlanCost(myPartnerProfile) : globalConfig.goldPrice;
  const isCustomPrice = myPartnerProfile?.customMonthlyFee !== null;

  const plans = [
    {
      id: "bronze",
      name: "ZUMA Bronce",
      price: globalConfig.bronzePrice,
      features: [
        "Hasta 100 turnos mensuales",
        "1 usuario de secretaría",
        "Notificaciones por Email",
        "Simulador de seña básico"
      ]
    },
    {
      id: "gold",
      name: "ZUMA Oro",
      price: globalConfig.goldPrice,
      features: [
        "Turnos mensuales ilimitados",
        "Hasta 5 usuarios administrativos",
        "Notificaciones WhatsApp (Twilio)",
        "Soporte prioritario 24/7",
        "Estadísticas avanzadas de cobros"
      ]
    },
    {
      id: "platinum",
      name: "ZUMA Platino",
      price: globalConfig.platinumPrice,
      features: [
        "Múltiples sucursales / sedes",
        "Acceso API para CRM propio",
        "Estudios y agendas por profesional",
        "SLA garantizado por contrato",
        "Integración con central telefónica"
      ]
    }
  ];

  // RENDER SUPERADMIN CONTABLE VIEW
  if (role === "superadmin") {
    return (
      <div className="flex flex-col gap-6 animate-slide-in">
        
        {/* Metric widgets row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Ingresos Mensuales (MRR)</span>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">${totalMRR} USD</h3>
              <span className="text-[9px] text-indigo-600 font-semibold block mt-1">Por abonos de suscripción</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Comisiones Recaudadas</span>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">${totalCommissionsCollected.toLocaleString("es-AR")} ARS</h3>
              <span className="text-[9px] text-teal-600 font-semibold block mt-1">Suma del % sobre señas</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Percent className="w-5 h-5 text-teal-600" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Clientes Activos</span>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{activePartnersCount} Socios</h3>
              <span className="text-[9px] text-slate-400 block mt-1">Uso de licencias comerciales</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Partners billing breakdown list */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              Suscripciones y Facturación Global
            </h2>

            <div className="flex flex-col gap-3">
              {partners.map((p) => {
                const planCost = getPartnerPlanCost(p);
                const hasOverride = p.customMonthlyFee !== null;
                
                return (
                  <div key={p.id} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div>
                      <h4 className="font-bold text-slate-800 leading-snug">{p.name}</h4>
                      <div className="flex gap-2 items-center mt-1 text-[10px] text-slate-500 capitalize">
                        <span>Plan {p.subscriptionPlan}</span>
                        <span>&bull;</span>
                        <span>Ingresó: {p.joinedDate}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-slate-800 block">${planCost} USD/mes</span>
                      {hasOverride && (
                        <span className="text-[8px] font-bold text-indigo-600 block uppercase tracking-wider font-mono">
                          Precio Custom
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SaaS fee description helper */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Info className="w-4.5 h-4.5 text-indigo-500" />
              Información de Contratos
            </h2>
            <div className="text-xs text-slate-500 leading-relaxed flex flex-col gap-3">
              <p>
                Los ingresos por abonos fijos de la plataforma se calculan en dólares (USD) según el nivel del socio.
              </p>
              <p>
                Las comisiones se recaudan directamente de la pasarela de pagos vinculada en Mercado Pago al momento de reservarse un turno con seña.
              </p>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // RENDER PARTNER (SOCIO) BILLING VIEW
  return (
    <div className="flex flex-col gap-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Mi Cuenta y Suscripción</h1>
        <p className="text-xs text-slate-400 mt-1">Gestiona tu abono mensual de ZUMA CRM, tarjetas registradas e historial de pagos.</p>
      </div>

      {isCustomPrice && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-xl text-xs leading-normal flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <span className="font-bold">¡Condición Comercial Personalizada Activa!</span>
            <p className="text-indigo-700/90 mt-1">
              El administrador de ZUMA ha configurado un costo mensual exclusivo para tu cuenta de **${myCost} USD** (en lugar de la tarifa estándar del plan Oro).
            </p>
          </div>
        </div>
      )}

      {/* Plans list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isSelected = myPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative
                ${isSelected ? "ring-2 ring-primary border-primary bg-teal-50/10" : "border-slate-200 opacity-70"}`}
            >
              {isSelected && (
                <span className="bg-primary text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  Plan Activo
                </span>
              )}

              <div>
                <h3 className="font-semibold text-slate-800 text-sm">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-2xl font-extrabold text-slate-800">
                    ${isSelected ? myCost : plan.price}
                  </span>
                  <span className="text-xs text-slate-400">/ mes</span>
                </div>

                <div className="h-px bg-slate-100 my-4" />

                <ul className="flex flex-col gap-2.5 text-xs text-slate-500">
                  {plan.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {isSelected ? (
                <div className="w-full text-center py-2 bg-primary text-white rounded-xl text-xs font-bold transition-all mt-6">
                  Suscrito
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => alert("Simulando cambio de plan de socio. Contactar a soporte.")}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all mt-6 cursor-pointer text-center"
                >
                  Cambiar Plan
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Billing details card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-primary" />
            Método de Pago Activo
          </h2>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 rounded bg-slate-800 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                VISA
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-xs">Visa terminado en 4321</h4>
                <p className="text-[9px] text-slate-400">Vencimiento: 12 / 2029</p>
              </div>
            </div>
            <button
              type="button"
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
              onClick={() => alert("Simulación: cambiar tarjeta.")}
            >
              Cambiar Tarjeta
            </button>
          </div>
        </div>

        {/* Invoice history card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <FileText className="w-4.5 h-4.5 text-primary" />
            Historial de Facturas
          </h2>

          <div className="flex flex-col gap-2">
            {[
              { id: "Z-0034", date: "15/06/2026", amount: myCost, status: "Abonado" },
              { id: "Z-0021", date: "15/05/2026", amount: myCost, status: "Abonado" }
            ].map((inv) => (
              <div key={inv.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <h4 className="font-semibold text-slate-800">Factura #{inv.id}</h4>
                  <span className="text-[9px] text-slate-400">{inv.date} &bull; ${inv.amount} USD</span>
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Descargando Factura #${inv.id}`)}
                  className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
