import BookingStepper from "@/components/BookingStepper";
import { Stethoscope, MapPin, Phone, Shield } from "lucide-react";

export default function ReservarPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Clinic Header Banner */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/10">
              <Stethoscope className="w-5.5 h-5.5" />
            </div>
          <div>
            <h1 className="font-display font-bold text-slate-800 text-lg leading-tight">Dr. Carlos Jensen</h1>
            <p className="text-xs font-semibold text-slate-400">Cardiología clínica | Cardio metabolismo | Arritmias | Embarazo | Chagas</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-teal-500" />
            <span>Sanatorio Central Banda · Clínica Del Pilar · Centro Médico Cannon</span>
          </div>
        </div>
        </div>
      </header>

      {/* Main Reservation Flow */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <BookingStepper />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 mt-auto text-xs">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-teal-400" />
            <span className="font-semibold text-slate-300">Turnero Anti No-Show Integrado</span>
          </div>
          <p className="text-center md:text-right">
            &copy; 2026 Dr. Carlos Jensen. Todos los derechos reservados. <br className="sm:hidden" />
            Desarrollado con Next.js y Prisma.
          </p>
        </div>
      </footer>
    </div>
  );
}
