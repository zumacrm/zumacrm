"use client";

import { useState, useEffect } from "react";
import BookingCalendar from "./BookingCalendar";
import CountdownTimer from "./CountdownTimer";
import { 
  Stethoscope, 
  Activity, 
  Heart, 
  TrendingUp, 
  User, 
  Upload, 
  FileText, 
  Trash2, 
  CheckCircle,
  CreditCard,
  PhoneCall,
  Loader2,
  AlertCircle,
  MapPin,
  Building,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ESTUDIOS = [
  {
    id: "Consulta general",
    nombre: "Consulta General",
    descripcion: "Revisión médica habitual, control clínico general e historial.",
    duracion: 30,
    costo: 30000,
    icon: Stethoscope,
    color: "from-blue-500 to-indigo-500"
  },
  {
    id: "Electrocardiograma",
    nombre: "Electrocardiograma (ECG)",
    descripcion: "Estudio de actividad eléctrica del corazón. Rápido y no invasivo.",
    duracion: 15,
    costo: 24000,
    icon: Activity,
    color: "from-teal-500 to-emerald-500"
  },
  {
    id: "Ergometría",
    nombre: "Ergometría (Prueba de Esfuerzo)",
    descripcion: "Evaluación cardíaca bajo esfuerzo físico controlado en cinta.",
    duracion: 45,
    costo: 45000,
    icon: TrendingUp,
    color: "from-orange-500 to-red-500"
  },
  {
    id: "Ecocardiograma",
    nombre: "Ecocardiograma",
    descripcion: "Ultrasonido del corazón para evaluar cavidades, válvulas y flujos.",
    duracion: 30,
    costo: 36000,
    icon: Heart,
    color: "from-pink-500 to-rose-500"
  }
];

const CLINICAS = [
  {
    id: "Sanatorio Central Banda",
    nombre: "Sanatorio Central Banda",
    direccion: "España 150, La Banda",
    diasAtencion: "Lunes y Miércoles",
    color: "from-cyan-500 to-blue-500"
  },
  {
    id: "Clínica Del Pilar",
    nombre: "Clínica Del Pilar",
    direccion: "Pellegrini 350, Santiago del Estero",
    diasAtencion: "Martes y Jueves",
    color: "from-indigo-500 to-violet-500"
  },
  {
    id: "Centro Médico Cannon",
    nombre: "Centro Médico Cannon",
    direccion: "Av. Belgrano Sur 1200, Santiago del Estero",
    diasAtencion: "Viernes",
    color: "from-emerald-500 to-teal-500"
  }
];

export default function BookingStepper() {
  const [step, setStep] = useState<number>(1);
  const [medicoConfig, setMedicoConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);
  
  // State variables for form
  const [selectedEstudio, setSelectedEstudio] = useState<typeof ESTUDIOS[0] | null>(null);
  const [selectedConsultorio, setSelectedConsultorio] = useState<string>("");
  const [selectedFecha, setSelectedFecha] = useState<string>("");
  const [selectedHora, setSelectedHora] = useState<string>("");
  
  const [pacienteData, setPacienteData] = useState({
    dni: "",
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    obraSocial: "Particular"
  });

  const [files, setFiles] = useState<{ name: string; size: number; type: string }[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // States for Checkout/Pre-reserve
  const [preReserveResult, setPreReserveResult] = useState<any>(null);
  const [submittingPreReserve, setSubmittingPreReserve] = useState<boolean>(false);
  const [errorPreReserve, setErrorPreReserve] = useState<string | null>(null);
  const [stepperError, setStepperError] = useState<string | null>(null);

  // Simulation states
  const [simulatingPayment, setSimulatingPayment] = useState<boolean>(false);
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false);
  const [expiredReservation, setExpiredReservation] = useState<boolean>(false);

  // Fetch dynamic doctor configurations on load
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/medico/config");
        const data = await res.json();
        if (data.success) {
          setMedicoConfig(data.config);
        }
      } catch (err) {
        console.error("Error loading doctor config:", err);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  // Check if clinic performs selected study
  const isStudySupported = (clinicId: string) => {
    if (!medicoConfig || !selectedEstudio) return true; // Fallback during loading
    const clinicConfig = medicoConfig.horario_atencion?.[clinicId];
    if (!clinicConfig) return false;
    const list = clinicConfig.estudios_disponibles || [];
    return list.includes(selectedEstudio.id);
  };

  // Get active studies labels of clinic
  const getClinicStudiesLabels = (clinicId: string) => {
    if (!medicoConfig) return "";
    const clinicConfig = medicoConfig.horario_atencion?.[clinicId];
    if (!clinicConfig) return "";
    const list = clinicConfig.estudios_disponibles || [];
    return list.join(", ");
  };

  // Step 1: select study
  const handleSelectEstudio = (estudio: typeof ESTUDIOS[0]) => {
    setSelectedEstudio(estudio);
    setStepperError(null);
    setStep(2);
  };

  // Step 2: select location
  const handleSelectLocation = (clinicId: string) => {
    setStepperError(null);
    if (!isStudySupported(clinicId)) {
      setStepperError(`El centro "${clinicId}" no realiza la práctica "${selectedEstudio?.nombre}". Por favor, elija otra sucursal.`);
      return;
    }
    setSelectedConsultorio(clinicId);
    setStep(3);
  };

  // Step 3: select slot
  const handleSelectSlot = (fecha: string, hora: string) => {
    setSelectedFecha(fecha);
    setSelectedHora(hora);
    setStep(4);
  };

  // Step 4: patient details input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPacienteData(prev => ({ ...prev, [name]: value }));
  };

  // Step 4: file attachment validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    
    // Check files count limit
    if (files.length + newFiles.length > 5) {
      setFileError("No puedes adjuntar más de 5 archivos en total.");
      return;
    }

    const acceptedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    const validFiles: typeof files = [];

    for (const file of newFiles) {
      // Size check (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setFileError(`El archivo "${file.name}" supera el límite de 2MB.`);
        return;
      }
      
      // Type check
      if (!acceptedTypes.includes(file.type)) {
        setFileError(`El archivo "${file.name}" no tiene un formato válido (PDF, PNG, JPG).`);
        return;
      }

      validFiles.push({
        name: file.name,
        size: file.size,
        type: file.type
      });
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  // Submit Pre-reserva
  const handleSubmitPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstudio || !selectedConsultorio || !selectedFecha || !selectedHora) return;

    setSubmittingPreReserve(true);
    setErrorPreReserve(null);

    try {
      const res = await fetch("/api/turnos/pre-reservar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: selectedFecha,
          hora_inicio: selectedHora,
          tipo_estudio: selectedEstudio.id,
          consultorio: selectedConsultorio,
          paciente: {
            dni: pacienteData.dni,
            nombre: pacienteData.nombre,
            apellido: pacienteData.apellido,
            telefono: pacienteData.telefono,
            email: pacienteData.email,
            obra_social: pacienteData.obraSocial,
          },
          via_reserva: "WEB_PACIENTE",
          paga_en_consultorio: false,
          archivos: files.map(f => f.name) // Simulating uploads on server
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al reservar.");
      }

      setPreReserveResult(data);
      setStep(5);
    } catch (err: any) {
      setErrorPreReserve(err.message);
    } finally {
      setSubmittingPreReserve(false);
    }
  };

  // Webhook Simulation triggers payment approved status change
  const handleSimulatePayment = async () => {
    if (!preReserveResult) return;
    setSimulatingPayment(true);

    try {
      const res = await fetch("/api/pagos/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutId: preReserveResult.pago.checkout_id,
          status: "approved",
          paymentId: `mp_pay_${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        })
      });

      const data = await res.json();

      if (data.success) {
        setPaymentCompleted(true);
        setStep(6);
      } else {
        alert("La simulación del pago falló: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error al contactar el simulador de webhooks.");
    } finally {
      setSimulatingPayment(false);
    }
  };

  const handleTimeout = () => {
    setExpiredReservation(true);
  };

  const restartFlow = () => {
    setStep(1);
    setSelectedEstudio(null);
    setSelectedConsultorio("");
    setSelectedFecha("");
    setSelectedHora("");
    setFiles([]);
    setPreReserveResult(null);
    setPaymentCompleted(false);
    setExpiredReservation(false);
    setErrorPreReserve(null);
    setStepperError(null);
  };

  // Helper formatting values
  const totalVal = selectedEstudio ? selectedEstudio.costo : 0;
  const seniaVal = totalVal / 2;

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      {/* Visual Stepper Steps Indicator */}
      {step <= 5 && (
        <div className="flex items-center justify-between mb-8 px-4 overflow-x-auto pb-2 scrollbar-none">
          {[
            { label: "Estudio", stepNum: 1 },
            { label: "Lugar", stepNum: 2 },
            { label: "Horario", stepNum: 3 },
            { label: "Tus Datos", stepNum: 4 },
            { label: "Checkout", stepNum: 5 }
          ].map((item, idx) => (
            <div key={item.stepNum} className="flex items-center flex-1 last:flex-initial shrink-0">
              <button
                onClick={() => step > item.stepNum && step < 5 && setStep(item.stepNum)}
                disabled={step <= item.stepNum || step === 5}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all shrink-0
                  ${step === item.stepNum ? "bg-primary text-white ring-4 ring-teal-100" : ""}
                  ${step > item.stepNum ? "bg-teal-500 text-white cursor-pointer" : ""}
                  ${step < item.stepNum ? "bg-slate-200 text-slate-400 cursor-not-allowed" : ""}
                `}
              >
                {step > item.stepNum ? <CheckCircle className="w-5 h-5" /> : item.stepNum}
              </button>
              <span className={`hidden sm:inline text-xs font-semibold ml-2 ${step >= item.stepNum ? "text-slate-700" : "text-slate-400"}`}>
                {item.label}
              </span>
              {idx < 4 && (
                <div className={`h-0.5 flex-1 min-w-[20px] mx-2 sm:mx-4 rounded ${step > item.stepNum ? "bg-teal-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* STEP 1: SELECT STUDY */}
      {step === 1 && (
        <div className="animate-slide-in">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-slate-800 tracking-tight">Solicitá tu Turno</h2>
            <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">Seleccioná el tipo de práctica o consulta médica que necesitás realizarte.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ESTUDIOS.map((est) => {
              const Icon = est.icon;
              return (
                <button
                  key={est.id}
                  onClick={() => handleSelectEstudio(est)}
                  className="glass-panel p-6 rounded-2xl border text-left flex gap-5 hover:border-teal-400/80 hover:shadow-lg hover:shadow-teal-500/5 group transition-all duration-300 cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${est.color} text-white flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-slate-800 group-hover:text-primary transition-colors">
                        {est.nombre}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{est.descripcion}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                      <span className="text-xs font-medium text-slate-400">Duración: {est.duracion} min</span>
                      <span className="text-base font-bold text-slate-800">${est.costo.toLocaleString("es-AR")}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: SELECT MEDICAL CENTER (With study verification) */}
      {step === 2 && selectedEstudio && (
        <div className="animate-slide-in">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button 
                onClick={() => setStep(1)} 
                className="text-xs font-semibold text-primary hover:underline"
              >
                &larr; Volver a Estudios
              </button>
              <h2 className="text-2xl font-display font-bold text-slate-800 mt-1">Elegí el lugar de atención</h2>
              <p className="text-xs text-slate-400">El doctor realiza prácticas específicas en cada sucursal.</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium">Estudio seleccionado:</span>
              <p className="text-sm font-bold text-primary">{selectedEstudio.nombre}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CLINICAS.map((clinic) => {
              const supported = isStudySupported(clinic.id);
              return (
                <button
                  key={clinic.id}
                  onClick={() => handleSelectLocation(clinic.id)}
                  className={`glass-panel p-6 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 relative overflow-hidden
                    ${supported 
                      ? "hover:border-teal-400/80 hover:shadow-lg hover:shadow-teal-500/5 group cursor-pointer" 
                      : "opacity-60 border-rose-200/60 bg-rose-50/10 cursor-not-allowed"}
                  `}
                >
                  <div>
                    {/* Top clinic badge */}
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${clinic.color} text-white flex items-center justify-center`}>
                        <Building className="w-5 h-5" />
                      </div>
                      
                      {!supported && (
                        <span className="bg-rose-50 border border-rose-200 text-[9px] font-bold text-rose-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          No realiza {selectedEstudio.nombre}
                        </span>
                      )}
                    </div>

                    <h3 className={`font-display font-semibold text-slate-800 ${supported ? "group-hover:text-primary" : ""} transition-colors`}>
                      {clinic.nombre}
                    </h3>
                    <div className="flex items-start gap-1.5 mt-2.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{clinic.direccion}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Atiende:</span>
                      <span className="text-xs font-semibold text-slate-700">{clinic.diasAtencion}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estudios disponibles:</span>
                      <span className="text-[10px] text-slate-500 leading-tight">
                        {getClinicStudiesLabels(clinic.id) || "Cargando..."}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {stepperError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 mt-6 animate-pulse">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{stepperError}</span>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: SELECT CALENDAR SLOT */}
      {step === 3 && selectedEstudio && selectedConsultorio && (
        <div className="animate-slide-in">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button 
                onClick={() => setStep(2)} 
                className="text-xs font-semibold text-primary hover:underline"
              >
                &larr; Volver a Sucursales
              </button>
              <h2 className="text-2xl font-display font-bold text-slate-800 mt-1">Elegí el día y horario</h2>
              <p className="text-xs text-slate-400">Mostrando disponibilidad para {selectedConsultorio}.</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium">Lugar / Práctica:</span>
              <p className="text-xs font-bold text-slate-700">{selectedConsultorio}</p>
              <p className="text-xs font-bold text-primary">{selectedEstudio.nombre}</p>
            </div>
          </div>

          <BookingCalendar 
            tipoEstudio={selectedEstudio.id} 
            consultorio={selectedConsultorio}
            onSelectSlot={handleSelectSlot} 
          />
        </div>
      )}

      {/* STEP 4: PATIENT DATA & ATTACHMENTS */}
      {step === 4 && selectedEstudio && selectedConsultorio && selectedFecha && (
        <div className="animate-slide-in max-w-2xl mx-auto">
          <div className="mb-6">
            <button 
              onClick={() => setStep(3)} 
              className="text-xs font-semibold text-primary hover:underline"
            >
              &larr; Volver al Calendario
            </button>
            <h2 className="text-2xl font-display font-bold text-slate-800 mt-1">Completa tus datos personales</h2>
            <p className="text-xs text-slate-400 mt-1">
              Turno seleccionado en <strong className="text-slate-600">{selectedConsultorio}</strong>: <span className="font-semibold text-slate-600">{format(new Date(selectedFecha + "T00:00:00"), "dd 'de' MMMM", { locale: es })} a las {selectedHora} hs</span>
            </p>
          </div>

          <form onSubmit={handleSubmitPaciente} className="glass-card p-6 rounded-2xl border border-slate-200 flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  value={pacienteData.nombre}
                  onChange={handleInputChange}
                  placeholder="ej. Juan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  required
                  value={pacienteData.apellido}
                  onChange={handleInputChange}
                  placeholder="ej. Pérez"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">DNI</label>
                <input
                  type="text"
                  name="dni"
                  required
                  value={pacienteData.dni}
                  onChange={handleInputChange}
                  placeholder="ej. 35123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Celular (WhatsApp)</label>
                <input
                  type="tel"
                  name="telefono"
                  required
                  value={pacienteData.telefono}
                  onChange={handleInputChange}
                  placeholder="ej. +5491165432100"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={pacienteData.email}
                  onChange={handleInputChange}
                  placeholder="ej. juan.perez@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Obra Social / Prepaga</label>
                <select
                  name="obraSocial"
                  value={pacienteData.obraSocial}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary bg-slate-50/50"
                >
                  <option value="Particular">Particular (Sin Obra Social)</option>
                  <option value="OSDE">OSDE</option>
                  <option value="Swiss Medical">Swiss Medical</option>
                  <option value="Galeno">Galeno</option>
                  <option value="PAMI">PAMI</option>
                  <option value="OSECAC">OSECAC</option>
                </select>
              </div>
            </div>

            {/* Document upload zone */}
            <div className="mt-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Adjuntar Pedido Médico o Autorización (Opcional, máx. 5 archivos)
              </label>
              
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-teal-400 hover:bg-slate-50/30 transition-all cursor-pointer relative group">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf, .png, .jpg, .jpeg"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors mb-2" />
                <p className="text-xs font-semibold text-slate-600">Haz clic para buscar o arrastra tus archivos aquí</p>
                <p className="text-[10px] text-slate-400 mt-1">Formatos permitidos: PDF, PNG, JPG de hasta 2MB cada uno.</p>
              </div>

              {fileError && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Uploaded Files list */}
              {files.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="font-medium text-slate-700 truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingPreReserve}
              className="w-full bg-primary hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-teal-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingPreReserve ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Reservando horario...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirmar y Proceder al Pago
                </>
              )}
            </button>
            
            {errorPreReserve && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-5 h-5" />
                <span>{errorPreReserve}</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* STEP 5: CHECKOUT & COUNTDOWN TIMER */}
      {step === 5 && preReserveResult && selectedEstudio && (
        <div className="animate-slide-in max-w-xl mx-auto flex flex-col gap-6">
          {expiredReservation ? (
            <div className="glass-panel p-8 rounded-2xl border border-red-200 text-center flex flex-col items-center gap-4">
              <AlertCircle className="w-16 h-16 text-red-500 animate-pulse" />
              <h3 className="text-xl font-display font-bold text-slate-800">¡Tiempo Expirado!</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Has superado el límite de 15 minutos para abonar la seña y el turno se ha liberado para otros pacientes.
              </p>
              <button
                onClick={restartFlow}
                className="mt-2 bg-primary hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow transition-all cursor-pointer"
              >
                Volver a empezar
              </button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-slate-800">Seña Obligatoria</h2>
                <p className="text-slate-500 text-sm mt-1">Completa el pago del 50% para asegurar tu turno médico.</p>
              </div>

              {/* Countdown Timer */}
              <CountdownTimer 
                expirationTime={preReserveResult.expira_el} 
                onTimeout={handleTimeout} 
              />

              {/* Turn Summary Box */}
              <div className="glass-card p-5 rounded-2xl border border-slate-200 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalles del Turno</h3>
                
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-700 text-sm">{selectedEstudio.nombre}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Lugar: <span className="font-semibold text-slate-600">{selectedConsultorio}</span></p>
                    <p className="text-xs text-slate-400 mt-0.5">Paciente: {pacienteData.nombre} {pacienteData.apellido}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-500">Fecha y Hora:</p>
                    <p className="text-sm font-bold text-slate-800">
                      {format(new Date(selectedFecha + "T00:00:00"), "dd/MM/yyyy")} - {selectedHora} hs
                    </p>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Monto Total:</span>
                    <span>${totalVal.toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-800">
                    <span>Seña Requerida (50%):</span>
                    <span className="text-primary">${seniaVal.toLocaleString("es-AR")}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <a
                  href={preReserveResult.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#009EE3] hover:bg-[#0089c7] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer text-center text-sm"
                >
                  <CreditCard className="w-5 h-5" />
                  Pagar Seña con Mercado Pago
                </a>

                {/* SIMULATED WEBHOOK TRIGGER */}
                <div className="border border-teal-200/60 bg-teal-50/50 p-4 rounded-xl flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">Módulo de Prueba / Demo</span>
                  <p className="text-xs text-teal-700 leading-relaxed">
                    Al hacer clic en el botón de abajo, se enviará una llamada de webhook simulada a tu servidor backend confirmando el pago. Esto activará la lógica del webhook y las alertas de notificación.
                  </p>
                  <button
                    onClick={handleSimulatePayment}
                    disabled={simulatingPayment}
                    className="w-full mt-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {simulatingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Simulando webhook de aprobación...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Simular Aprobación de Pago (Webhook)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 6: SUCCESS CONFIRMATION */}
      {step === 6 && selectedEstudio && (
        <div className="animate-slide-in max-w-lg mx-auto glass-panel p-8 rounded-2xl border border-teal-200 text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-500">
            <CheckCircle className="w-10 h-10 stroke-[1.5]" />
          </div>

          <div>
            <h2 className="text-2xl font-display font-bold text-slate-800">¡Turno Confirmado!</h2>
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
              Hemos registrado el pago de tu seña con éxito. Se ha enviado una confirmación a tu correo <strong className="text-slate-700">{pacienteData.email}</strong> y por mensaje de WhatsApp a <strong className="text-slate-700">{pacienteData.telefono}</strong>.
            </p>
          </div>

          <div className="w-full bg-slate-50 border border-slate-200/50 rounded-xl p-4 flex flex-col gap-2.5 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Estudio:</span>
              <span className="font-bold text-slate-800">{selectedEstudio.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Lugar:</span>
              <span className="font-bold text-teal-600">{selectedConsultorio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Fecha:</span>
              <span className="font-bold text-slate-800">{format(new Date(selectedFecha + "T00:00:00"), "dd/MM/yyyy")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Hora:</span>
              <span className="font-bold text-slate-800">{selectedHora} hs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Paciente:</span>
              <span className="font-bold text-slate-800">{pacienteData.nombre} {pacienteData.apellido} (DNI {pacienteData.dni})</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-400 font-medium">Monto Señado (50%):</span>
              <span className="font-bold text-teal-600">${seniaVal.toLocaleString("es-AR")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Saldo Restante:</span>
              <span className="font-bold text-slate-800">${seniaVal.toLocaleString("es-AR")} (Pagas en Consultorio)</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-400 text-xs leading-relaxed max-w-sm mt-1">
            <AlertCircle className="w-5 h-5 stroke-[1.5] text-primary shrink-0 mt-0.5" />
            <span>Recuerda que si necesitas reprogramar o cancelar debes hacerlo con al menos 24 horas de antelación o perderás tu seña.</span>
          </div>

          <button
            onClick={restartFlow}
            className="w-full bg-primary hover:bg-teal-600 text-white font-bold py-3 rounded-xl transition-all cursor-pointer mt-2"
          >
            Reservar otro turno
          </button>
        </div>
      )}
    </div>
  );
}
