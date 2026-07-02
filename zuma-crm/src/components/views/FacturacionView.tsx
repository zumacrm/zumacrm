"use client";

import { useState } from "react";
import { CreditCard, Award, FileText, CheckCircle2, ShieldCheck, ArrowUpRight } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

export default function FacturacionView() {
  const [activePlan, setActivePlan] = useState("premium");

  const plans: Plan[] = [
    {
      id: "basic",
      name: "ZUMA Básico",
      price: 50,
      features: [
        "Hasta 100 turnos mensuales",
        "1 usuario de secretaría",
        "Notificaciones por Email",
        "Simulador de seña básico"
      ]
    },
    {
      id: "premium",
      name: "ZUMA Premium",
      price: 100,
      features: [
        "Turnos mensuales ilimitados",
        "Hasta 5 usuarios administrativos",
        "Notificaciones WhatsApp (Twilio)",
        "Soporte prioritario 24/7",
        "Estadísticas avanzadas de cobros"
      ],
      recommended: true
    },
    {
      id: "enterprise",
      name: "ZUMA Corporativo",
      price: 250,
      features: [
        "Múltiples sucursales / sedes",
        "Acceso API para CRM propio",
        "Estudios y agendas por profesional",
        "SLA garantizado por contrato",
        "Integración con central telefónica"
      ]
    }
  ];

  const invoices = [
    { id: "Z-0034", date: "15/06/2026", amount: 100.00, status: "Abonado" },
    { id: "Z-0021", date: "15/05/2026", amount: 100.00, status: "Abonado" },
    { id: "Z-0008", date: "15/04/2026", amount: 100.00, status: "Abonado" }
  ];

  return (
    <div className="flex flex-col gap-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Suscripción y Facturación</h1>
        <p className="text-xs text-slate-400">Administra tu plan de suscripción de la plataforma ZUMA CRM, métodos de pago y facturas.</p>
      </div>

      {/* Plans list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isSelected = activePlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative
                ${isSelected ? "ring-2 ring-primary border-primary" : "border-slate-200"}`}
            >
              {plan.recommended && (
                <span className="bg-primary text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  Recomendado
                </span>
              )}

              <div>
                <h3 className="font-semibold text-slate-800 text-sm">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-2xl font-extrabold text-slate-800">${plan.price}</span>
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

              <button
                type="button"
                onClick={() => setActivePlan(plan.id)}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all mt-6 cursor-pointer text-center
                  ${isSelected 
                    ? "bg-primary text-white shadow-md shadow-teal-500/10" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"}`}
              >
                {isSelected ? "Plan Activo" : "Cambiar de Plan"}
              </button>
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
              onClick={() => alert("Simulación: editar tarjeta.")}
            >
              Cambiar Tarjeta
            </button>
          </div>

          <div className="flex gap-2.5 items-start bg-teal-50/50 border border-teal-200/50 p-3.5 rounded-xl text-xs text-teal-800 leading-normal">
            <ShieldCheck className="w-4.5 h-4.5 text-teal-600 shrink-0 mt-0.5" />
            <p>Tu suscripción se renovará automáticamente el día <strong>15/07/2026</strong>. Se facturará el monto del plan seleccionado en tu tarjeta de crédito registrada.</p>
          </div>
        </div>

        {/* Invoice history card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <FileText className="w-4.5 h-4.5 text-primary" />
            Historial de Facturas
          </h2>

          <div className="flex flex-col gap-2">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <h4 className="font-semibold text-slate-800">Factura #{inv.id}</h4>
                  <span className="text-[9px] text-slate-400">{inv.date} &bull; ${inv.amount.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Simulación: descargando Factura #${inv.id}`)}
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
