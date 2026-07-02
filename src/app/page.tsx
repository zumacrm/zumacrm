import Link from "next/link";
import { 
  Stethoscope, 
  Calendar, 
  UserCheck, 
  MapPin, 
  Phone, 
  Clock, 
  ShieldCheck, 
  Activity, 
  Heart, 
  TrendingUp 
} from "lucide-react";

export default function Home() {
  const services = [
    { name: "Consulta General", duration: "30 min", price: "$30.000", icon: Stethoscope, desc: "Control clínico y seguimiento general" },
    { name: "Electrocardiograma (ECG)", duration: "15 min", price: "$24.000", icon: Activity, desc: "Evaluación del ritmo cardíaco" },
    { name: "Ecocardiograma", duration: "30 min", price: "$36.000", icon: Heart, desc: "Estudio ultrasónico morfológico" },
    { name: "Ergometría (Esfuerzo)", duration: "45 min", price: "$45.000", icon: TrendingUp, desc: "Prueba de esfuerzo en cinta" }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      
      {/* Clinic Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/10">
              <Stethoscope className="w-5.5 h-5.5" />
            </div>
          <div>
            <h1 className="font-display font-bold text-slate-800 text-lg leading-tight">Dr. Carlos Jensen</h1>
            <p className="text-xs font-semibold text-slate-400">Cardiología clínica | Cardio metabolismo | Arritmias | Embarazo | Chagas</p>
          </div>
          </div>

          <Link
            href="/admin"
            className="text-xs font-bold text-slate-500 hover:text-primary border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all"
          >
            Acceso Secretaria
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12 flex flex-col gap-16 justify-center">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Hero Left Content */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6 animate-slide-in">
            <span className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full border border-teal-200/50">
              Cardiología Moderna & Sin Demoras
            </span>
            <h2 className="text-4xl sm:text-5xl font-display font-extrabold text-slate-900 tracking-tight leading-tight">
              Reservá tu turno <br className="hidden sm:inline" />
              médico de forma <span className="text-gradient">segura y simple</span>.
            </h2>
            <p className="text-slate-500 text-sm max-w-md leading-relaxed">
              Planificá tus estudios cardiológicos y consultas en minutos. Garantizamos slots disponibles en tiempo real y confirmación inmediata abonando una seña del 50%.
            </p>
            
            {/* Quick Actions Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
              <Link
                href="/reservar"
                className="bg-primary hover:bg-teal-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Calendar className="w-5 h-5" />
                Solicitar un Turno
              </Link>
              <Link
                href="/mis-turnos"
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-3.5 px-6 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <UserCheck className="w-5 h-5" />
                Ver / Cancelar Mis Turnos
              </Link>
            </div>

            {/* Quick Clinic Info cards */}
            <div className="grid grid-cols-2 gap-4 w-full mt-6 pt-6 border-t border-slate-200/60 text-xs text-slate-500">
              <div className="flex items-start gap-2 text-left">
                <MapPin className="w-4.5 h-4.5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-700">Centros de Atención</h4>
                  <p className="text-[10px] leading-tight">Sanatorio Central Banda · Clínica Del Pilar · Centro Médico Cannon</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left">
                <Clock className="w-4.5 h-4.5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-700">Atención Médica</h4>
                  <p>Lunes a Viernes de 09 a 18 hs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Column */}
          <div className="flex-1 w-full flex flex-col gap-4 animate-slide-in">
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 flex flex-col gap-4">
              <h3 className="font-display font-semibold text-slate-800 text-sm">Nuestros Servicios y Valores</h3>
              
              <div className="flex flex-col gap-3">
                {services.map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <div key={idx} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center">
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 text-xs">{s.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-800">{s.price}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Duración: {s.duration}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Policy badge */}
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-3.5 flex items-start gap-2.5 mt-1 text-[11px] text-teal-800 leading-normal font-medium">
                <ShieldCheck className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Política Anti-Ausentismo:</strong> Se abona el 50% de la prestación al reservar. La cita se puede reprogramar de forma autónoma hasta 24 horas antes sin recargos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 mt-auto text-xs text-center">
        <p>&copy; 2026 Dr. Carlos Jensen. Sanatorio Central Banda · Clínica Del Pilar · Centro Médico Cannon.</p>
      </footer>
    </div>
  );
}
