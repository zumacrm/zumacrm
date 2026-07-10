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
  Info,
  Sparkles
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
  const [selectedWebhookEvent, setSelectedWebhookEvent] = useState("mp_deposit_received");
  const [webhookLogs, setWebhookLogs] = useState<{ time: string; type: "info" | "success" | "error"; msg: string }[]>([]);

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

  const commRate = myPartnerProfile?.customCommissionPercentage !== null 
    ? myPartnerProfile.customCommissionPercentage 
    : globalConfig.globalCommission;

  const accumulatedCommissions = turnos
    .filter(t => t.partnerId === "dr-carlos-jensen" && (t.estado_turno === "CONFIRMADO" || t.estado_turno === "ATENDIDO"))
    .reduce((sum, t) => {
      const paidSeña = t.pago?.monto_pagado || 0;
      return sum + (paidSeña * commRate) / 100;
    }, 0);

  const handleTriggerWebhook = () => {
    const timeStr = new Date().toLocaleTimeString();
    
    setWebhookLogs(prev => [
      ...prev,
      { time: timeStr, type: "info", msg: `POST /api/webhooks/${selectedWebhookEvent === "mp_deposit_received" ? "mercadopago" : "stripe"} - Payload JSON` }
    ]);

    setTimeout(() => {
      if (selectedWebhookEvent === "mp_deposit_received") {
        const allTurnos = mockDB.getTurnos();
        const pendingTurnoIdx = allTurnos.findIndex(t => t.partnerId === "dr-carlos-jensen" && t.estado_turno === "PRE_RESERVADO");
        
        let clientName = "Martín Díaz";
        if (pendingTurnoIdx !== -1) {
          allTurnos[pendingTurnoIdx].estado_turno = "CONFIRMADO";
          if (allTurnos[pendingTurnoIdx].pago) {
            allTurnos[pendingTurnoIdx].pago!.estado_pago = "APROBADO";
            allTurnos[pendingTurnoIdx].pago!.monto_pagado = allTurnos[pendingTurnoIdx].pago!.seña_requerida;
          }
          clientName = `${allTurnos[pendingTurnoIdx].paciente.nombre} ${allTurnos[pendingTurnoIdx].paciente.apellido}`;
          mockDB.saveTurnos(allTurnos);
        } else {
          const newTurno = {
            id: `t_web_${Math.random().toString(36).substring(2, 6)}`,
            partnerId: "dr-carlos-jensen",
            partnerName: "Dr. Carlos Jensen",
            paciente: {
              dni: "38999000",
              nombre: "Clara",
              apellido: "Bustos",
              telefono: "+549385001122",
              email: "clara.bustos@gmail.com",
              obra_social: "OSDE"
            },
            fecha: "2026-07-16",
            hora: "10:30",
            especialidad: "Cardiología",
            modalidad: "presencial" as const,
            estado_turno: "CONFIRMADO" as const,
            pago: {
              monto_total: 30000,
              seña_requerida: 15000,
              estado_pago: "APROBADO" as const,
              metodo_pago: "Mercado Pago" as const,
              monto_pagado: 15000
            }
          };
          allTurnos.push(newTurno);
          clientName = "Clara Bustos";
          mockDB.saveTurnos(allTurnos);
        }

        const savedNotifs = localStorage.getItem("zuma_partner_notifications");
        const list = savedNotifs ? JSON.parse(savedNotifs) : [];
        const newN = {
          id: `n_mp_${Date.now()}`,
          title: "Seña Recibida (Webhook)",
          desc: `Mercado Pago aprobó el depósito de seña de ${clientName}. Comisión ZUMA calculada.`,
          time: "Hace 1 min",
          type: "payment",
          isRead: false
        };
        localStorage.setItem("zuma_partner_notifications", JSON.stringify([newN, ...list]));

        setWebhookLogs(prev => [
          ...prev,
          { time: timeStr, type: "success", msg: "Webhook 200 OK. Pago de seña verificado. Comisión registrada." }
        ]);

        alert(`Simulado: Webhook Mercado Pago procesado. Se incrementó la comisión por seña de ${clientName}.`);
        window.location.reload();
      } else {
        const savedNotifs = localStorage.getItem("zuma_partner_notifications");
        const list = savedNotifs ? JSON.parse(savedNotifs) : [];
        const newN = {
          id: `n_stripe_${Date.now()}`,
          title: "Suscripción Renovada (Webhook)",
          desc: `Stripe acreditó el cobro mensual de tu abono de plan ZUMA CRM por $${myCost} USD.`,
          time: "Hace 1 min",
          type: "payment",
          isRead: false
        };
        localStorage.setItem("zuma_partner_notifications", JSON.stringify([newN, ...list]));

        setWebhookLogs(prev => [
          ...prev,
          { time: timeStr, type: "success", msg: "Webhook 200 OK. Suscripción Stripe liquidada. Próximo vencimiento extendido por 30 días." }
        ]);

        alert("Simulado: Webhook Stripe procesado. ¡Suscripción mensual de abono actualizada!");
        window.location.reload();
      }
    }, 800);
  };

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
        
        {/* Subscription status & Billing details cards */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col gap-4 animate-slide-in">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Layers className="w-4 h-4 text-primary" />
              Estado y Vigencia de la Suscripción
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5 animate-slide-in">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Último Pago</span>
                <p className="text-sm font-bold text-slate-800">15/06/2026</p>
                <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Monto: ${myCost} USD
                </span>
              </div>
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5 animate-slide-in">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Próximo Vencimiento</span>
                <p className="text-sm font-bold text-slate-800">15/07/2026</p>
                <span className="text-[9px] text-indigo-600 font-semibold mt-0.5">Renovación automática</span>
              </div>
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5 animate-slide-in">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Comisión Contrato SaaS</span>
                <p className="text-sm font-bold text-slate-800">
                  {myPartnerProfile?.customCommissionPercentage !== null ? myPartnerProfile?.customCommissionPercentage : globalConfig.globalCommission}%
                </p>
                <span className="text-[9px] text-slate-400 mt-0.5">Por seña recibida</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5 animate-slide-in">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Comisiones Acumuladas</span>
                <p className="text-sm font-bold text-slate-850">${accumulatedCommissions.toLocaleString("es-AR")} ARS</p>
                <span className="text-[9.5px] text-amber-600 font-extrabold block mt-0.5 uppercase tracking-wider font-mono">saldoPendiente</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
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

        {/* Cron Billing Job Simulator Widget (Fase 7) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Sparkles className="w-4.5 h-4.5 text-indigo-650 animate-pulse" />
            Simulador de Ciclo de Facturación y Crons (Fase 7)
          </h2>
          <p className="text-[10px] text-slate-400 leading-normal">
            ZUMA CRM factura el **Día 1**, envía alertas de pago los **Días 5 y 8**, y restringe el acceso al panel el **Día 10** en caso de falta de pago. Ejecuta las etapas secuencialmente para validar la suspensión.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
            <button
              type="button"
              onClick={() => {
                const saved = localStorage.getItem("zuma_partner_notifications");
                const currentList = saved ? JSON.parse(saved) : [];
                const newN = {
                  id: `n_cron1_${Date.now()}`,
                  title: "Nueva Factura Disponible",
                  desc: `Se ha generado tu factura de abono mensual Oro de $${myCost} USD más comisiones acumuladas. Vence el día 10.`,
                  time: "Hace 1 min",
                  type: "payment",
                  isRead: false
                };
                localStorage.setItem("zuma_partner_notifications", JSON.stringify([newN, ...currentList]));
                alert("Simulado Día 1: Factura emitida. Se ha enviado una notificación de abono de suscripción.");
                window.location.reload();
              }}
              className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-bold cursor-pointer transition-colors text-center"
            >
              Día 1: Emitir Factura
            </button>

            <button
              type="button"
              onClick={() => {
                const saved = localStorage.getItem("zuma_partner_notifications");
                const currentList = saved ? JSON.parse(saved) : [];
                const newN = {
                  id: `n_cron5_${Date.now()}`,
                  title: "Recordatorio de Pago",
                  desc: "Tu abono de suscripción ZUMA vence en 5 días. Evita cortes de servicio regularizando tu cuenta.",
                  time: "Hace 1 min",
                  type: "payment",
                  isRead: false
                };
                localStorage.setItem("zuma_partner_notifications", JSON.stringify([newN, ...currentList]));
                alert("Simulado Día 5: Primera alerta de cobro despachada.");
                window.location.reload();
              }}
              className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-bold cursor-pointer transition-colors text-center"
            >
              Día 5: Alerta Pago
            </button>

            <button
              type="button"
              onClick={() => {
                const saved = localStorage.getItem("zuma_partner_notifications");
                const currentList = saved ? JSON.parse(saved) : [];
                const newN = {
                  id: `n_cron8_${Date.now()}`,
                  title: "⚠️ ALERTA CRÍTICA",
                  desc: "Tu cuenta ZUMA CRM presenta un saldo impago. El acceso será suspendido automáticamente el día 10.",
                  time: "Hace 1 min",
                  type: "payment",
                  isRead: false
                };
                localStorage.setItem("zuma_partner_notifications", JSON.stringify([newN, ...currentList]));
                alert("Simulado Día 8: Alerta crítica despachada.");
                window.location.reload();
              }}
              className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-[10px] font-bold cursor-pointer transition-colors text-center"
            >
              Día 8: Alerta Crítica
            </button>

            <button
              type="button"
              onClick={() => {
                const list = mockDB.getPartners();
                const idx = list.findIndex(p => p.id === "dr-carlos-jensen");
                if (idx !== -1) {
                  list[idx].status = "suspended";
                  mockDB.savePartners(list);
                }
                const saved = localStorage.getItem("zuma_partner_notifications");
                const currentList = saved ? JSON.parse(saved) : [];
                const newN = {
                  id: `n_cron10_${Date.now()}`,
                  title: "Cuenta Suspendida",
                  desc: "Tu acceso al panel de control ha sido restringido temporalmente debido a falta de pago de abono.",
                  time: "Hace 1 min",
                  type: "payment",
                  isRead: false
                };
                localStorage.setItem("zuma_partner_notifications", JSON.stringify([newN, ...currentList]));
                alert("Simulado Día 10: Suspensión de cuenta. El middleware bloqueará la pantalla de inmediato.");
                window.location.reload();
              }}
              className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-800 rounded-xl text-[10px] font-bold cursor-pointer transition-colors text-center"
            >
              Día 10: Suspender
            </button>
          </div>
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

        {/* Webhooks Simulator Console (Fase 7) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm text-slate-200 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Consola de Webhooks & Pasarelas (Mercado Pago / Stripe)
            </h2>
            <span className="text-[9px] font-mono text-slate-500">zuma-crm/webhooks</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400">Seleccionar Evento de Pasarela:</label>
            <select
              value={selectedWebhookEvent}
              onChange={(e) => setSelectedWebhookEvent(e.target.value)}
              className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none text-slate-350 cursor-pointer font-sans"
            >
              <option value="mp_deposit_received">Mercado Pago: payment.approved (Seña de Reserva de $15.000 ARS)</option>
              <option value="stripe_saas_paid">Stripe: invoice.payment_succeeded (Abono SaaS Oro de $59 USD)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTriggerWebhook}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer flex-1 text-center"
            >
              Enviar Webhook (POST)
            </button>
            <button
              type="button"
              onClick={() => setWebhookLogs([])}
              className="bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold py-2 px-3 rounded-xl text-xs transition-all cursor-pointer text-center"
            >
              Limpiar Logs
            </button>
          </div>

          {/* Raw Terminal Console logs */}
          <div className="bg-slate-950 rounded-xl p-3 font-mono text-[9.5px] text-slate-300 leading-relaxed border border-slate-850 h-32 overflow-y-auto">
            <span className="text-slate-500 block border-b border-slate-900 pb-1.5 mb-1.5">// Consola de salida de red ZUMA CRM</span>
            {webhookLogs.length === 0 ? (
              <span className="text-slate-600 font-sans text-[10px]">Esperando disparo de webhooks...</span>
            ) : (
              webhookLogs.map((log, idx) => (
                <div key={idx} className="mb-1 text-left">
                  <span className="text-slate-500">[{log.time}]</span>{" "}
                  <span className={log.type === "error" ? "text-rose-500 font-semibold" : log.type === "success" ? "text-emerald-400 font-semibold" : "text-slate-300"}>
                    {log.msg}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
