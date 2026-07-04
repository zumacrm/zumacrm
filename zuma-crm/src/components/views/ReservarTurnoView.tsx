"use client";

import { useState, useEffect } from "react";
import { mockDB, MockTurno } from "@/lib/mockData";
import { format, addDays, isSameDay, startOfWeek, addWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Building2, 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  UserCheck, 
  AlertCircle, 
  HelpCircle,
  FileText,
  ShieldCheck,
  Stethoscope,
  Activity,
  Heart,
  TrendingUp,
  Compass
} from "lucide-react";

interface ReservarTurnoViewProps {
  currentPatient: {
    dni: string;
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
    obraSocial: string;
  } | null;
  onRegisterPatient: (patient: any) => void;
  onViewHistory: () => void;
  partnerId?: string | null;
  initialLocationName?: string | null;
}

export default function ReservarTurnoView({ 
  currentPatient, 
  onRegisterPatient,
  onViewHistory,
  partnerId = null,
  initialLocationName = null
}: ReservarTurnoViewProps) {
  const [step, setStep] = useState(1);
  const [selectedConsultorio, setSelectedConsultorio] = useState("");
  const [selectedEstudio, setSelectedEstudio] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [selectedHora, setSelectedHora] = useState("");
  
  // Registration form state (for guest users)
  const [regForm, setRegForm] = useState({
    dni: "",
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    obraSocial: "Particular"
  });
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
 
  // Retrieve active partner details
  const activePartner = mockDB.getPartners().find(p => p.id === partnerId) || 
                        mockDB.getPartners().find(p => p.id === "dr-carlos-jensen") ||
                        mockDB.getPartners()[0];

  const clinics = activePartner.id === "dr-carlos-jensen"
    ? [
        {
          name: "Sanatorio Central Banda",
          days: "Lunes y Miércoles",
          allowedDays: [1, 3],
          estudios: ["Consulta general", "Electrocardiograma", "Ergometría"],
          address: "España 150, La Banda"
        },
        {
          name: "Clínica Del Pilar",
          days: "Martes y Jueves",
          allowedDays: [2, 4],
          estudios: ["Consulta general", "Ecocardiograma"],
          address: "Pellegrini 350, Santiago"
        },
        {
          name: "Centro Médico Cannon",
          days: "Viernes",
          allowedDays: [5],
          estudios: ["Consulta general", "Electrocardiograma", "Ergometría", "Ecocardiograma"],
          address: "Av. Cannon 240, Santiago"
        }
      ]
    : (activePartner?.locations && activePartner.locations.length > 0)
      ? activePartner.locations.map(loc => ({
          name: loc.name,
          days: "Lunes a Sábado",
          allowedDays: [1, 2, 3, 4, 5, 6],
          estudios: activePartner.specialties && activePartner.specialties.length > 0 ? activePartner.specialties : ["Servicio General"],
          address: loc.address
        }))
      : [
          {
            name: activePartner?.name || "Sede Central",
            days: "Lunes a Sábado",
            allowedDays: [1, 2, 3, 4, 5, 6],
            estudios: activePartner?.specialties && activePartner.specialties.length > 0 ? activePartner.specialties : ["Servicio General"],
            address: activePartner?.address || ""
          }
        ];

  // Dynamic services list matching partner specialties
  const availableServices = activePartner.id === "dr-carlos-jensen"
    ? [
        { id: "Consulta general", label: "Consulta general", desc: "Revisión clínica habitual, control clínico general e historial.", cost: 30000, icon: Stethoscope, color: "from-blue-500 to-indigo-500" },
        { id: "Electrocardiograma", label: "Electrocardiograma (ECG)", desc: "Estudio de actividad eléctrica del corazón. Rápido y no invasivo.", cost: 24000, icon: Activity, color: "from-teal-500 to-emerald-500" },
        { id: "Ergometría", label: "Ergometría (Prueba Esfuerzo)", desc: "Evaluación cardíaca bajo esfuerzo físico controlado en cinta.", cost: 45000, icon: TrendingUp, color: "from-orange-500 to-red-500" },
        { id: "Ecocardiograma", label: "Ecocardiograma", desc: "Ultrasonido del corazón para evaluar cavidades y válvulas.", cost: 36000, icon: Heart, color: "from-pink-500 to-rose-500" }
      ]
    : activePartner.specialties.map((spec, i) => {
        const colors = [
          "from-blue-500 to-indigo-500",
          "from-teal-500 to-emerald-500",
          "from-orange-500 to-red-500",
          "from-pink-500 to-rose-500",
          "from-purple-500 to-indigo-650",
          "from-emerald-500 to-cyan-500"
        ];
        const icons = [Building2, Activity, TrendingUp, Heart, Stethoscope, Compass];
        return {
          id: spec,
          label: spec,
          desc: `Servicio completo de ${spec} en nuestras sedes habilitadas.`,
          cost: 15000 + (i * 3000), // dynamic price calculation
          icon: icons[i % icons.length] || Building2,
          color: colors[i % colors.length]
        };
      });

  // Pre-select consultorio and jump to step 2 if preselected location is passed
  useEffect(() => {
    if (initialLocationName) {
      setSelectedConsultorio(initialLocationName);
      setStep(2);
    } else if (clinics.length > 0) {
      setSelectedConsultorio(clinics[0].name);
    }
  }, [initialLocationName, partnerId]);

  // Set default selectedEstudio when consultorio or partner changes
  useEffect(() => {
    const clinic = clinics.find(c => c.name === selectedConsultorio) || clinics[0];
    if (clinic && clinic.estudios.length > 0) {
      setSelectedEstudio(clinic.estudios[0]);
    } else {
      setSelectedEstudio("Servicio General");
    }
  }, [selectedConsultorio, partnerId]);

  // Load patient data if they are already logged in
  useEffect(() => {
    if (currentPatient) {
      setRegForm({
        dni: currentPatient.dni,
        nombre: currentPatient.nombre,
        apellido: currentPatient.apellido,
        telefono: currentPatient.telefono,
        email: currentPatient.email,
        obraSocial: currentPatient.obraSocial
      });
    }
  }, [currentPatient]);

  // Determine if selected study is allowed at the selected clinic
  const isStudyAllowed = (clinicName: string, study: string) => {
    const clinic = clinics.find(c => c.name === clinicName);
    if (!clinic) return false;
    return clinic.estudios.includes(study);
  };

  // Generate date options for the next 2 weeks matching clinic operating days
  const getDateOptions = () => {
    const options: Date[] = [];
    const clinic = clinics.find(c => c.name === selectedConsultorio);
    if (!clinic) return [];

    const allowed = clinic.allowedDays;
    let current = addDays(new Date(), 1);
    
    while (options.length < 12) {
      if (allowed.includes(current.getDay())) {
        options.push(current);
      }
      current = addDays(current, 1);
    }
    return options;
  };

  // Generate slots for the selected date
  const getSlots = () => {
    if (!selectedConsultorio || !selectedDate) return [];
    
    // Static hours listing
    return ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "15:00", "15:30", "16:00", "16:30"].map(slot => ({
      time: slot,
      isBooked: false
    }));
  };

  // Step 1 check
  const handleNextStep1 = () => {
    if (!selectedConsultorio) {
      setErrorMsg("Debes seleccionar una sede");
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  // Step 2 check
  const handleNextStep2 = () => {
    if (!selectedEstudio) {
      setErrorMsg("Debes seleccionar un servicio o práctica");
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  // Step 3 check
  const handleNextStep3 = () => {
    if (!selectedHora) {
      setErrorMsg("Debes seleccionar un horario");
      return;
    }
    setErrorMsg(null);
    setStep(4);
  };

  // Confirm booking & register patient
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient && (!regForm.nombre || !regForm.apellido || !regForm.dni)) {
      setErrorMsg("Completa los datos obligatorios para continuar");
      return;
    }

    const currentSrv = availableServices.find(s => s.id === selectedEstudio);
    const cost = currentSrv ? currentSrv.cost : 30000;

    // Call registration prop to update parent session
    if (!currentPatient) {
      onRegisterPatient({
        dni: regForm.dni,
        nombre: regForm.nombre,
        apellido: regForm.apellido,
        telefono: regForm.telefono || "+549385000000",
        email: regForm.email || "paciente@zuma.com",
        obraSocial: regForm.obraSocial
      });
    }

    // Add appointment to database
    mockDB.addTurno({
      partnerId: activePartner.id,
      partnerName: activePartner.name,
      paciente: {
        dni: regForm.dni,
        nombre: regForm.nombre,
        apellido: regForm.apellido,
        telefono: regForm.telefono || "+549385000000",
        email: regForm.email || "paciente@zuma.com",
        obra_social: regForm.obraSocial
      },
      fecha: format(selectedDate, "yyyy-MM-dd"),
      hora_inicio: selectedHora,
      hora_fin: selectedHora, // simple end mapping
      tipo_estudio: selectedEstudio,
      consultorio: selectedConsultorio,
      estado_turno: "PRE_RESERVADO",
      via_reserva: "WEB_PACIENTE",
      pago: {
        monto_total: cost,
        monto_pagado: cost / 2, // 50% seña
        checkout_id: `pref_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        estado_pago: "PENDIENTE" // Seña pendiente de abonar
      }
    });

    // View reservations history tab
    onViewHistory();
  };

  const datesAvailable = getDateOptions();
  const slotsAvailable = getSlots();

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Reserva Online</h1>
        <p className="text-xs text-slate-400">Portal Público de Reserva Online &bull; Servicios y Agendas</p>
      </div>

      {/* Stepper indicators */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-2 overflow-x-auto">
        {[
          { label: "1. Lugar", active: step >= 1 },
          { label: "2. Servicio", active: step >= 2 },
          { label: "3. Horario", active: step >= 3 },
          { label: "4. Confirmar", active: step >= 4 }
        ].map((s, idx) => (
          <div key={idx} className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
              ${s.active ? "bg-primary text-white border-primary" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
              {s.label}
            </span>
            {idx < 3 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
          </div>
        ))}
      </div>

      {/* STEP 1: SELECT CLINIC LOCATION */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-slate-700 text-sm">Paso 1: Selecciona la ubicación o sucursal</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clinics.map((c) => {
              const isSelected = selectedConsultorio === c.name;
              return (
                <div
                  key={c.name}
                  onClick={() => {
                    setSelectedConsultorio(c.name);
                    setErrorMsg(null);
                  }}
                  className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-350 shadow-xs flex flex-col justify-between gap-4 select-none
                    hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5
                    ${isSelected ? "ring-2 ring-indigo-500 border-transparent shadow-sm bg-indigo-50/5" : "border-slate-200"}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm ${isSelected ? "bg-indigo-600 scale-105" : "bg-[#0f172a]"}`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs leading-snug">{c.name}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 font-semibold">{c.days}</p>
                    <p className="text-[10px] text-slate-500 leading-normal mt-1">{c.address}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-semibold">
              <AlertCircle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end mt-2">
            <button
              onClick={handleNextStep1}
              className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-xs py-2 px-5 rounded-xl shadow cursor-pointer flex items-center gap-1 transition-colors"
            >
              Siguiente Paso
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT MEDICAL PRACTICE */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-700 text-sm">Paso 2: Selecciona el servicio o producto a reservar</h3>
            <span className="text-[10px] font-bold text-slate-400">Sede: {selectedConsultorio}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableServices.map((p) => {
              const isAllowed = isStudyAllowed(selectedConsultorio, p.id);
              const isSelected = selectedEstudio === p.id;
              const CardIcon = p.icon;
              
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    if (isAllowed) {
                      setSelectedEstudio(p.id);
                      setErrorMsg(null);
                    }
                  }}
                  className={`bg-white border rounded-2xl p-5 transition-all duration-300 flex gap-4 relative select-none
                    ${!isAllowed ? "opacity-35 cursor-not-allowed border-slate-200" : "cursor-pointer hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"}
                    ${isSelected && isAllowed ? "ring-2 ring-indigo-500 border-transparent shadow-sm bg-indigo-50/5" : "border-slate-200"}`}
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${p.color} text-white flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 ${isSelected && isAllowed ? "scale-110" : ""}`}>
                    <CardIcon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-slate-800 text-xs leading-tight truncate">{p.label}</h4>
                        <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">
                          ${p.cost.toLocaleString("es-AR")}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{p.desc}</p>
                    </div>
                    
                    {!isAllowed && (
                      <span className="absolute bottom-2 right-2 text-[8px] bg-rose-50 border border-rose-200 text-rose-600 px-1.5 py-0.5 rounded font-bold">
                        No disponible en esta sede
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver
            </button>
            <button
              onClick={handleNextStep2}
              className="flex-1 bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow cursor-pointer"
            >
              Siguiente Paso
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DATE & TIME SELECTOR */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-700 text-sm">Paso 3: Selecciona fecha y horario</h3>
            <span className="text-[10px] font-bold text-slate-400">{selectedEstudio} &bull; {selectedConsultorio}</span>
          </div>

          {/* Date cards grid */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Fechas Disponibles</label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {datesAvailable.map((d) => {
                const isSelected = isSameDay(selectedDate, d);
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedHora("");
                      setErrorMsg(null);
                    }}
                    className={`px-3 py-2 rounded-xl border text-center transition-all cursor-pointer shrink-0 flex flex-col items-center gap-0.5 min-w-[75px]
                      ${isSelected ? "bg-primary border-primary text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    <span className="text-[9px] font-semibold uppercase">{format(d, "eee", { locale: es })}</span>
                    <span className="text-sm font-bold">{format(d, "dd")}</span>
                    <span className="text-[8px] uppercase">{format(d, "MMM", { locale: es })}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hourly Slots Grid */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Horarios para el {format(selectedDate, "dd 'de' MMMM", { locale: es })}</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slotsAvailable.map((s) => {
                const isSelected = selectedHora === s.time;
                return (
                  <button
                    key={s.time}
                    disabled={s.isBooked}
                    onClick={() => {
                      setSelectedHora(s.time);
                      setErrorMsg(null);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer
                      ${s.isBooked ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed" : ""}
                      ${isSelected && !s.isBooked ? "bg-teal-50 border-teal-500 text-teal-700 font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {s.time} hs
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver
            </button>
            <button
              onClick={handleNextStep3}
              className="flex-1 bg-[#0f172a] hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow cursor-pointer"
            >
              Siguiente Paso
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: GUEST REGISTRATION OR LOGGED CONFIRM */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-slate-700 text-sm">Paso 4: Confirma tus datos e identificación</h3>
          
          <form onSubmit={handleConfirmBooking} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
            
            {/* Booking summary row */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 flex flex-col gap-1.5">
              <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider">Resumen de Turno</span>
              <div className="flex justify-between font-medium">
                <span>Consulta:</span>
                <span className="text-slate-800 font-bold">{selectedEstudio}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Lugar:</span>
                <span className="text-slate-800 font-bold">{selectedConsultorio}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Fecha y hora:</span>
                <span className="text-teal-600 font-bold">{format(selectedDate, "dd/MM/yyyy")} a las {selectedHora} hs</span>
              </div>
            </div>

            {/* Registration inputs (only editable/visible if guest or new patient) */}
            <div className="flex flex-col gap-3">
              <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Identificación del Cliente / Paciente</span>
              
              {currentPatient ? (
                // Logged patient card
                <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/50 rounded-xl flex items-center gap-2.5 text-xs text-slate-600">
                  <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800">{currentPatient.nombre} {currentPatient.apellido}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">DNI: {currentPatient.dni} &bull; {currentPatient.obraSocial}</p>
                  </div>
                </div>
              ) : (
                // Input forms for guest
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Nombre</label>
                      <input
                        type="text"
                        required
                        value={regForm.nombre}
                        onChange={(e) => setRegForm(prev => ({ ...prev, nombre: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                        placeholder="ej. Roberto"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Apellido</label>
                      <input
                        type="text"
                        required
                        value={regForm.apellido}
                        onChange={(e) => setRegForm(prev => ({ ...prev, apellido: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                        placeholder="ej. Sosa"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">DNI</label>
                      <input
                        type="text"
                        required
                        value={regForm.dni}
                        onChange={(e) => setRegForm(prev => ({ ...prev, dni: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary font-mono"
                        placeholder="DNI"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Celular / WhatsApp</label>
                      <input
                        type="tel"
                        required
                        value={regForm.telefono}
                        onChange={(e) => setRegForm(prev => ({ ...prev, telefono: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                        placeholder="+549..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={regForm.email}
                        onChange={(e) => setRegForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Prepaga / Obra Social</label>
                      <select
                        value={regForm.obraSocial}
                        onChange={(e) => setRegForm(prev => ({ ...prev, obraSocial: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary bg-white"
                      >
                        <option value="Particular">Particular (Sin Obra Social)</option>
                        <option value="OSDE">OSDE</option>
                        <option value="Swiss Medical">Swiss Medical</option>
                        <option value="Galeno">Galeno</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px bg-slate-100 my-1" />

            <div className="flex items-start gap-1.5 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-250/20 text-[10px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p>Para confirmar el bloqueo del slot se requiere una seña del 50%. En el siguiente paso simularás el pago del depósito con Mercado Pago.</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-teal-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer text-center"
              >
                {currentPatient ? "Confirmar Reserva" : "Registrarse y Reservar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
