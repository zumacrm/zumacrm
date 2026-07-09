"use client";

import { format, addDays, subDays } from "date-fns";

export interface ConsultorioLocation {
  id: string;
  name: string;
  address: string;
  mapsUrl: string;
  line2?: string;
  phone?: string;
  observations?: string;
  imageUrl?: string; // stores logo/emblem identifier
}

export interface Partner {
  id: string;
  name: string;
  category: string;
  status: "active" | "pending" | "suspended";
  cuit: string;
  email: string;
  phone: string;
  address: string; // legacy address
  bio: string;
  logoColor: string;
  joinedDate: string;
  
  // Advanced SaaS & Profile fields
  subscriptionPlan: "bronze" | "gold" | "platinum";
  customMonthlyFee: number | null;
  customCommissionPercentage: number | null;
  logoUrl: string | null; // e.g. "emblem_clinic", "emblem_doctor"
  specialties: string[];
  locations: ConsultorioLocation[];
}

export interface MockTurno {
  id: string;
  partnerId?: string;
  partnerName?: string;
  paciente: {
    dni: string;
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
    obra_social: string;
  };
  fecha: string; // "yyyy-MM-dd"
  hora_inicio: string; // "hh:mm"
  hora_fin: string; // "hh:mm"
  tipo_estudio: string;
  consultorio: string;
  estado_turno: "PRE_RESERVADO" | "CONFIRMADO" | "CANCELADO_PACIENTE" | "CANCELADO_MEDICO" | "ATENDIDO";
  via_reserva: "WEB_PACIENTE" | "SECRETARIA";
  creado_el: string;
  expira_el: string;
  pago?: {
    monto_total: number;
    monto_pagado: number;
    checkout_id: string;
    estado_pago: "PENDIENTE" | "APROBADO" | "RECHAZADO" | "REEMBOLSADO";
  };
}

export interface MedicoConfig {
  nombre: string;
  especialidad: string;
  valor_consulta: number;
  porcentaje_senia: number;
  horario_atencion: any;
}

export interface GlobalSaaSConfig {
  globalCommission: number; // percentage, e.g. 10
  bronzePrice: number;       // default cost, e.g. 29
  goldPrice: number;         // default cost, e.g. 59
  platinumPrice: number;     // default cost, e.g. 99
}

export interface MockCoupon {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  partnerId: string;
  isActive: boolean;
  description: string;
}

export interface MockChatMessage {
  id: string;
  partnerId: string;
  patientDni: string;
  sender: "partner" | "patient";
  message: string;
  timestamp: string;
  isRead: boolean;
}

const DEFAULT_SAAS_CONFIG: GlobalSaaSConfig = {
  globalCommission: 10,
  bronzePrice: 29,
  goldPrice: 59,
  platinumPrice: 99
};

const INITIAL_COUPONS: MockCoupon[] = [
  {
    code: "PRIMERTURNO",
    type: "fixed",
    value: 5000,
    partnerId: "dr-carlos-jensen",
    isActive: true,
    description: "Descuento de bienvenida de $5.000 pesos en tu primera reserva."
  },
  {
    code: "PROMO10",
    type: "percentage",
    value: 10,
    partnerId: "dr-carlos-jensen",
    isActive: true,
    description: "Descuento del 10% en cualquier consulta o estudio."
  }
];

const INITIAL_CHAT_MESSAGES: MockChatMessage[] = [
  {
    id: "msg1",
    partnerId: "dr-carlos-jensen",
    patientDni: "38111222", // Roberto Sosa
    sender: "patient",
    message: "Hola Dr. quería consultar si debo llevar los análisis previos para la consulta.",
    timestamp: subDays(new Date(), 1).toISOString(),
    isRead: true
  },
  {
    id: "msg2",
    partnerId: "dr-carlos-jensen",
    patientDni: "38111222",
    sender: "partner",
    message: "Hola Roberto, sí por favor. Trae todo el historial cardiológico que tengas.",
    timestamp: subDays(new Date(), 1).toISOString(),
    isRead: true
  },
  {
    id: "msg3",
    partnerId: "dr-carlos-jensen",
    patientDni: "38111222",
    sender: "patient",
    message: "Excelente, ¡muchas gracias! Nos vemos el jueves.",
    timestamp: new Date().toISOString(),
    isRead: false
  }
];

// Initial Partners list
const INITIAL_PARTNERS: Partner[] = [
  {
    id: "dr-carlos-jensen",
    name: "Dr. Carlos Jensen",
    category: "Profesionales",
    status: "active",
    cuit: "20-35123456-9",
    email: "carlos.jensen@consultorio.com",
    phone: "+549385654321",
    address: "Sanatorio Central Banda",
    bio: "Especialista en cardiología clínica, arritmias, cardiometabolismo, control en embarazo y chagas.",
    logoColor: "bg-teal-500",
    joinedDate: "12/03/2026",
    subscriptionPlan: "gold",
    customMonthlyFee: null,
    customCommissionPercentage: null,
    logoUrl: "emblem_doctor",
    specialties: ["Cardiología clínica", "Cardio metabolismo", "Arritmias", "Embarazo", "Chagas"],
    locations: [
      {
        id: "loc-1",
        name: "Sanatorio Central Banda",
        address: "España 150, La Banda",
        mapsUrl: "https://maps.google.com/?q=Sanatorio+Central+Banda+La+Banda",
        line2: "Consultorio 4, Planta Baja",
        phone: "0385-4221100",
        observations: "Estacionamiento disponible en la calle España. Secretaría general en Planta Baja.",
        imageUrl: "emblem_clinic"
      },
      {
        id: "loc-2",
        name: "Clínica Del Pilar",
        address: "Pellegrini 350, Santiago del Estero",
        mapsUrl: "https://maps.google.com/?q=Clinica+Del+Pilar+Santiago+del+Estero",
        line2: "1º Piso, Consultorio A",
        phone: "0385-4212121",
        observations: "Ingreso directo por escalera o ascensor. Anunciarse en la recepción del primer piso.",
        imageUrl: "emblem_heart"
      },
      {
        id: "loc-3",
        name: "Centro Médico Cannon",
        address: "Av. Belgrano Sur 800, Santiago",
        mapsUrl: "https://maps.google.com/?q=Centro+Medico+Cannon+Santiago+del+Estero",
        line2: "Consultorio B, PB",
        phone: "0385-4241010",
        observations: "Consultas programadas únicamente para los días viernes por la tarde.",
        imageUrl: "emblem_cross"
      }
    ]
  },
  {
    id: "laboratorios-biolab",
    name: "Laboratorios Biolab",
    category: "Laboratorios",
    status: "active",
    cuit: "30-99887766-3",
    email: "bioquimica@biolab.com",
    phone: "+5493854332211",
    address: "Av. Belgrano Norte 450, Santiago",
    bio: "Laboratorio bioquímico avanzado para estudios clínicos y genéticos.",
    logoColor: "bg-emerald-500",
    joinedDate: "20/06/2026",
    subscriptionPlan: "bronze",
    customMonthlyFee: null,
    customCommissionPercentage: null,
    logoUrl: "emblem_clinic",
    specialties: ["Análisis Clínicos", "Hemogramas", "Bioquímica", "Laboratorios"],
    locations: [
      {
        id: "loc-4",
        name: "BioLab Central",
        address: "Av. Belgrano Norte 450, Santiago",
        mapsUrl: "https://maps.google.com/?q=Av+Belgrano+Norte+450+Santiago+del+Estero",
        line2: "Planta Baja",
        phone: "0385-4332211",
        observations: "Extracciones de sangre de 07:00 a 10:00 hs sin turno previo.",
        imageUrl: "emblem_clinic"
      }
    ]
  },
  {
    id: "potenza-gym",
    name: "Potenza Gym",
    category: "Gimnasios",
    status: "active",
    cuit: "20-33221144-8",
    email: "contacto@potenzagym.com",
    phone: "+5493855001122",
    address: "Av. Belgrano Sur 1450, Santiago del Estero",
    bio: "Centro de preparación física de alto rendimiento, entrenamiento funcional y musculación en Santiago del Estero.",
    logoColor: "bg-orange-500",
    joinedDate: "05/04/2026",
    subscriptionPlan: "platinum",
    customMonthlyFee: 79,
    customCommissionPercentage: 5,
    logoUrl: "emblem_cross",
    specialties: ["Entrenamiento Funcional", "Musculación", "CrossFit", "Kinesiología"],
    locations: [
      {
        id: "loc-5",
        name: "Potenza Gym Central",
        address: "Av. Belgrano Sur 1450, Santiago del Estero",
        mapsUrl: "https://maps.google.com/?q=Av+Belgrano+Sur+1450+Santiago+del+Estero",
        line2: "Planta Alta",
        phone: "0385-5001122",
        observations: "Acceso directo por ascensor o escaleras principales.",
        imageUrl: "emblem_cross"
      }
    ]
  },
  {
    id: "patagonia-sde",
    name: "Patagonia Refugio SDE",
    category: "Restaurantes",
    status: "active",
    cuit: "23-28492049-9",
    email: "santiago@refugiopatagonia.com.ar",
    phone: "+5493854245678",
    address: "Av. Belgrano Sur 2100, Santiago del Estero",
    bio: "Refugio oficial de Cerveza Patagonia en Santiago del Estero. Cerveza tirada, gastronomía gourmet y patio cervecero.",
    logoColor: "bg-rose-500",
    joinedDate: "12/05/2026",
    subscriptionPlan: "gold",
    customMonthlyFee: null,
    customCommissionPercentage: null,
    logoUrl: "emblem_clinic",
    specialties: ["Cerveza Tirada", "Hamburguesas", "Pizzas", "Eventos"],
    locations: [
      {
        id: "loc-6",
        name: "Refugio Patagonia SDE",
        address: "Av. Belgrano Sur 2100, Santiago del Estero",
        mapsUrl: "https://maps.google.com/?q=Av+Belgrano+Sur+2100+Santiago+del+Estero",
        line2: "Patio y Terraza",
        phone: "0385-4245678",
        observations: "Abierto todos los días de 19:00 a 02:00 hs.",
        imageUrl: "emblem_clinic"
      }
    ]
  },
  {
    id: "bar-lugones",
    name: "Lugones Bar & Resto",
    category: "Restaurantes",
    status: "active",
    cuit: "20-44930291-7",
    email: "contacto@barlugones.com.ar",
    phone: "+5493854271122",
    address: "Av. Lugones y Besares, La Banda",
    bio: "Bar y restaurante temático en La Banda. Gastronomía regional, coctelería y shows musicales en vivo.",
    logoColor: "bg-amber-600",
    joinedDate: "18/05/2026",
    subscriptionPlan: "bronze",
    customMonthlyFee: null,
    customCommissionPercentage: null,
    logoUrl: "emblem_clinic",
    specialties: ["Reserva de Mesas", "Eventos Privados", "Cenas", "Shows en Vivo"],
    locations: [
      {
        id: "loc-7",
        name: "Lugones La Banda",
        address: "Besares 450, La Banda",
        mapsUrl: "https://maps.google.com/?q=Besares+450+La+Banda",
        line2: "Salón Principal y Terraza",
        phone: "0385-4271122",
        observations: "Abierto de jueves a domingos a partir de las 20 hs.",
        imageUrl: "emblem_clinic"
      }
    ]
  },
  {
    id: "instituto-dao",
    name: "Instituto DAO",
    category: "Cursos",
    status: "active",
    cuit: "30-28193849-5",
    email: "formacion@institutodao.com",
    phone: "+5493854214433",
    address: "Av. Belgrano Sur 720, Santiago del Estero",
    bio: "Centro de capacitación integral, formación profesional y clases de desarrollo personal y marcial.",
    logoColor: "bg-indigo-600",
    joinedDate: "01/06/2026",
    subscriptionPlan: "gold",
    customMonthlyFee: null,
    customCommissionPercentage: null,
    logoUrl: "emblem_cross",
    specialties: ["Cursos de Capacitación", "Clases de Artes Marciales", "Medicina China", "Talleres"],
    locations: [
      {
        id: "loc-8",
        name: "DAO Sede Central",
        address: "Av. Belgrano Sur 720, Santiago del Estero",
        mapsUrl: "https://maps.google.com/?q=Av+Belgrano+Sur+720+Santiago+del+Estero",
        line2: "Piso 1, Aula A",
        phone: "0385-4214433",
        observations: "Inscripciones abiertas todo el año para cursos homologados.",
        imageUrl: "emblem_cross"
      }
    ]
  },
  {
    id: "cabanas-tafi",
    name: "Cabañas Sendas del Tafí",
    category: "Agencias de viaje",
    status: "active",
    cuit: "20-22119944-3",
    email: "reservas@sendasdeltafi.com",
    phone: "+5493867421010",
    address: "Ruta Provincial 307 Km 60, Tafí del Valle, Tucumán",
    bio: "Complejo de cabañas totalmente equipadas en el corazón de Tafí del Valle. Disfruta de la naturaleza y el descanso.",
    logoColor: "bg-emerald-600",
    joinedDate: "22/04/2026",
    subscriptionPlan: "platinum",
    customMonthlyFee: 120,
    customCommissionPercentage: 7,
    logoUrl: "emblem_heart",
    specialties: ["Alquiler de Cabañas", "Pensión Completa", "Excursiones", "Cabalgatas"],
    locations: [
      {
        id: "loc-9",
        name: "Complejo Tafí del Valle",
        address: "Ruta Provincial 307 Km 60, Tafí del Valle, Tucumán",
        mapsUrl: "https://maps.google.com/?q=Ruta+Provincial+307+Tafi+del+Valle+Tucuman",
        line2: "Cabaña Principal",
        phone: "03867-421010",
        observations: "Se requiere reserva previa con 50% de seña para confirmar estadía.",
        imageUrl: "emblem_heart"
      }
    ]
  },
  {
    id: "flores-odontologia",
    name: "Flores Odontología Integral",
    category: "Profesionales",
    status: "active",
    cuit: "20-28192839-4",
    email: "odontoflores@gmail.com",
    phone: "+5493854229988",
    address: "Libertad 340, Santiago del Estero",
    bio: "Clínica de odontología integral y estética dental en Santiago del Estero. Dr. Lucas Flores y equipo.",
    logoColor: "bg-teal-500",
    joinedDate: "10/05/2026",
    subscriptionPlan: "gold",
    customMonthlyFee: null,
    customCommissionPercentage: null,
    logoUrl: "emblem_doctor",
    specialties: ["Implantes Dentales", "Ortodoncia", "Estética Dental", "Blanqueamiento"],
    locations: [
      {
        id: "loc-10",
        name: "Consultorio Libertad",
        address: "Libertad 340, Santiago del Estero",
        mapsUrl: "https://maps.google.com/?q=Libertad+340+Santiago+del+Estero",
        line2: "Planta Baja, Consultorio A",
        phone: "0385-4229988",
        observations: "Atención con turnos programados y prepagas selectas.",
        imageUrl: "emblem_doctor"
      }
    ]
  },
  {
    id: "sanatorio-central-banda",
    name: "Sanatorio Central Banda",
    category: "Clínicas",
    status: "active",
    cuit: "30-49204910-8",
    email: "contacto@sanatoriocentralbanda.com",
    phone: "+5493854221100",
    address: "España 150, La Banda",
    bio: "Sanatorio de alta complejidad médica en la ciudad de La Banda. Guardia 24 horas y consultorios externos.",
    logoColor: "bg-blue-500",
    joinedDate: "15/02/2026",
    subscriptionPlan: "platinum",
    customMonthlyFee: null,
    customCommissionPercentage: null,
    logoUrl: "emblem_clinic",
    specialties: ["Guardia 24hs", "Consultorios Externos", "Internación", "Cardiología"],
    locations: [
      {
        id: "loc-sanatorio-banda",
        name: "Sanatorio Central Banda",
        address: "España 150, La Banda",
        mapsUrl: "https://maps.google.com/?q=Sanatorio+Central+Banda+La+Banda",
        line2: "Planta Baja, Recepción Principal",
        phone: "0385-4221100",
        observations: "Ingreso de guardia de emergencias por calle España.",
        imageUrl: "emblem_clinic"
      }
    ]
  },
  {
    id: "clinica-del-pilar",
    name: "Clínica Del Pilar SDE",
    category: "Clínicas",
    status: "active",
    cuit: "30-58204930-9",
    email: "info@clinicadelpilar.com",
    phone: "+5493854212121",
    address: "Pellegrini 350, Santiago del Estero",
    bio: "Clínica de especialidades médicas y cirugías programadas en el centro de Santiago del Estero.",
    logoColor: "bg-indigo-500",
    joinedDate: "18/03/2026",
    subscriptionPlan: "gold",
    customMonthlyFee: null,
    customCommissionPercentage: null,
    logoUrl: "emblem_clinic",
    specialties: ["Cirugías", "Internación", "Consultorios", "Traumatología"],
    locations: [
      {
        id: "loc-clinica-pilar",
        name: "Clínica Del Pilar",
        address: "Pellegrini 350, Santiago del Estero",
        mapsUrl: "https://maps.google.com/?q=Clinica+Del+Pilar+Santiago+del+Estero",
        line2: "Pellegrini 350",
        phone: "0385-4212121",
        observations: "Anunciarse en recepción de Planta Baja antes de ingresar.",
        imageUrl: "emblem_clinic"
      }
    ]
  },
  {
    id: "centro-medico-cannon",
    name: "Centro Médico Cannon",
    category: "Clínicas",
    status: "active",
    cuit: "30-50204910-1",
    email: "cannon@centromedico.com",
    phone: "+5493854241010",
    address: "Av. Belgrano Sur 800, Santiago",
    bio: "Centro médico integral de atención ambulatoria y estudios complementarios en Santiago del Estero.",
    logoColor: "bg-teal-500",
    joinedDate: "01/04/2026",
    subscriptionPlan: "bronze",
    customMonthlyFee: null,
    customCommissionPercentage: null,
    logoUrl: "emblem_clinic",
    specialties: ["Estudios Médicos", "Ecografías", "Odontología", "Cardiología"],
    locations: [
      {
        id: "loc-centro-cannon",
        name: "Centro Médico Cannon",
        address: "Av. Belgrano Sur 800, Santiago",
        mapsUrl: "https://maps.google.com/?q=Centro+Medico+Cannon+Santiago+del+Estero",
        line2: "Consultorio A, PB",
        phone: "0385-4241010",
        observations: "Atención programada de lunes a viernes.",
        imageUrl: "emblem_clinic"
      }
    ]
  }
];

const INITIAL_MEDICO_CONFIG: MedicoConfig = {
  nombre: "Dr. Carlos Jensen",
  especialidad: "Cardiología clínica | Cardio metabolismo | Arritmias | Embarazo | Chagas",
  valor_consulta: 30000,
  porcentaje_senia: 50,
  horario_atencion: {
    "Sanatorio Central Banda": {
      lunes: [{ inicio: "09:00", fin: "13:00" }, { inicio: "14:00", fin: "18:00" }],
      miercoles: [{ inicio: "09:00", fin: "13:00" }],
      estudios_disponibles: ["Consulta general", "Electrocardiograma", "Ergometría"]
    },
    "Clínica Del Pilar": {
      martes: [{ inicio: "09:00", fin: "13:00" }, { inicio: "14:00", fin: "18:00" }],
      jueves: [{ inicio: "09:00", fin: "13:00" }, { inicio: "14:00", fin: "18:00" }],
      estudios_disponibles: ["Consulta general", "Ecocardiograma"]
    },
    "Centro Médico Cannon": {
      viernes: [{ inicio: "09:00", fin: "13:00" }],
      estudios_disponibles: ["Consulta general", "Electrocardiograma", "Ergometría", "Ecocardiograma"]
    }
  }
};

const studyCost = (estudio: string): number => {
  if (estudio === "Ergometría") return 45000;
  if (estudio === "Electrocardiograma") return 24000;
  if (estudio === "Ecocardiograma") return 36000;
  return 30000;
};

const getPreloadedTurnos = (): MockTurno[] => {
  const list: MockTurno[] = [];
  const today = new Date();
  const tomorrowStr = format(addDays(today, 1), "yyyy-MM-dd");
  
  // Patient names to choose from
  const clients = [
    { dni: "20444333", nombre: "Roberto", apellido: "Sosa", telefono: "+5493854111222", email: "roberto.sosa@gmail.com", obra_social: "OSDE" },
    { dni: "30555666", nombre: "Ana", apellido: "Gómez", telefono: "+5493855333444", email: "ana.gomez@gmail.com", obra_social: "Particular" },
    { dni: "18999888", nombre: "Pedro", apellido: "Martínez", telefono: "+5493854999000", email: "pedro.mtz@gmail.com", obra_social: "Swiss Medical" },
    { dni: "40111222", nombre: "Sofía", apellido: "López", telefono: "+5493856111333", email: "sofia.lopez@yahoo.com", obra_social: "Particular" },
    { dni: "28333444", nombre: "Carlos", apellido: "Rodríguez", telefono: "+5493855555666", email: "carlos.rod@hotmail.com", obra_social: "PAMI" },
    { dni: "32777888", nombre: "Lucía", apellido: "Fernández", telefono: "+5493854888999", email: "lucia.fer@outlook.com", obra_social: "Particular" },
    { dni: "25666777", nombre: "Martín", apellido: "Díaz", telefono: "+5493855111000", email: "martin.diaz@gmail.com", obra_social: "OSDE" },
    { dni: "35444555", nombre: "María", apellido: "Álvarez", telefono: "+5493854555666", email: "maria.alvarez@gmail.com", obra_social: "Swiss Medical" }
  ];

  // 1. History (past 5 days) for stats
  for (let dayOffset = -5; dayOffset < 0; dayOffset++) {
    const targetDate = addDays(today, dayOffset);
    const dateStr = format(targetDate, "yyyy-MM-dd");
    
    // 2 turnos per past day
    for (let i = 0; i < 2; i++) {
      const client = clients[(Math.abs(dayOffset) * 2 + i) % clients.length];
      const hour = i === 0 ? "09:30" : "15:00";
      const isAttended = i === 0; // first is attended, second is confirmed or cancelled
      const estado = isAttended ? "ATENDIDO" : (dayOffset % 2 === 0 ? "CONFIRMADO" : "CANCELADO_PACIENTE");
      const consultorio = i === 0 ? "Sanatorio Central Banda" : "Clínica Del Pilar";
      const estudio = i === 0 ? "Consulta general" : "Electrocardiograma";
      const cost = studyCost(estudio);
      
      list.push({
        id: `hist-jensen-${dayOffset}-${i}`,
        paciente: {
          dni: client.dni,
          nombre: client.nombre,
          apellido: client.apellido,
          telefono: client.telefono,
          email: client.email,
          obra_social: client.obra_social
        },
        fecha: dateStr,
        hora_inicio: hour,
        hora_fin: hour,
        tipo_estudio: estudio,
        consultorio: consultorio,
        estado_turno: estado,
        via_reserva: i === 0 ? "WEB_PACIENTE" : "MANUAL_PROFESIONAL",
        creado_el: addDays(targetDate, -2).toISOString(),
        expira_el: targetDate.toISOString(),
        pago: {
          monto_total: cost,
          monto_pagado: estado === "CANCELADO_PACIENTE" ? 0 : cost / 2,
          checkout_id: `pref_past_${dayOffset}_${i}`,
          estado_pago: estado === "CANCELADO_PACIENTE" ? "RECHAZADO" : "APROBADO"
        }
      });
    }
  }

  // 2. Today bookings for Dr. Carlos Jensen
  const todayStr = format(today, "yyyy-MM-dd");
  list.push({
    id: "jensen-today-1",
    paciente: clients[0],
    fecha: todayStr,
    hora_inicio: "09:00",
    hora_fin: "09:30",
    tipo_estudio: "Consulta general",
    consultorio: "Sanatorio Central Banda",
    estado_turno: "CONFIRMADO",
    via_reserva: "WEB_PACIENTE",
    creado_el: today.toISOString(),
    expira_el: today.toISOString(),
    pago: { monto_total: 30000, monto_pagado: 15000, checkout_id: "pref_t1", estado_pago: "APROBADO" }
  });
  list.push({
    id: "jensen-today-2",
    paciente: clients[1],
    fecha: todayStr,
    hora_inicio: "10:30",
    hora_fin: "11:00",
    tipo_estudio: "Electrocardiograma",
    consultorio: "Sanatorio Central Banda",
    estado_turno: "PRE_RESERVADO",
    via_reserva: "WEB_PACIENTE",
    creado_el: today.toISOString(),
    expira_el: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    pago: { monto_total: 24000, monto_pagado: 0, checkout_id: "pref_t2", estado_pago: "PENDIENTE" }
  });
  list.push({
    id: "jensen-today-3",
    paciente: clients[2],
    fecha: todayStr,
    hora_inicio: "15:30",
    hora_fin: "16:00",
    tipo_estudio: "Ergometría",
    consultorio: "Clínica Del Pilar",
    estado_turno: "CONFIRMADO",
    via_reserva: "MANUAL_PROFESIONAL",
    creado_el: today.toISOString(),
    expira_el: today.toISOString(),
    pago: { monto_total: 45000, monto_pagado: 22500, checkout_id: "PAGA_EN_CONSULTORIO", estado_pago: "PENDIENTE" }
  });

  // 3. Tomorrow and future bookings for Dr. Carlos Jensen
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const targetDate = addDays(today, dayOffset);
    const dateStr = format(targetDate, "yyyy-MM-dd");
    
    // Let's add 2 bookings on weekdays
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // no weekends
      for (let i = 0; i < 2; i++) {
        const client = clients[(dayOffset * 2 + i) % clients.length];
        const hour = i === 0 ? "11:00" : "16:30";
        const consultorio = i === 0 ? "Sanatorio Central Banda" : "Clínica Del Pilar";
        const estudio = i === 0 ? "Consulta general" : "Ecocardiograma";
        const cost = studyCost(estudio);
        
        list.push({
          id: `future-jensen-${dayOffset}-${i}`,
          paciente: {
            dni: client.dni,
            nombre: client.nombre,
            apellido: client.apellido,
            telefono: client.telefono,
            email: client.email,
            obra_social: client.obra_social
          },
          fecha: dateStr,
          hora_inicio: hour,
          hora_fin: hour,
          tipo_estudio: estudio,
          consultorio: consultorio,
          estado_turno: "CONFIRMADO",
          via_reserva: "WEB_PACIENTE",
          creado_el: today.toISOString(),
          expira_el: today.toISOString(),
          pago: {
            monto_total: cost,
            monto_pagado: cost / 2,
            checkout_id: `pref_fut_${dayOffset}_${i}`,
            estado_pago: "APROBADO"
          }
        });
      }
    }
  }

  // 4. Seeding bookings for other partners
  // Biolab
  list.push({
    id: "biolab-1",
    paciente: clients[3],
    fecha: todayStr,
    hora_inicio: "09:30",
    hora_fin: "10:00",
    tipo_estudio: "Análisis Clínicos",
    consultorio: "Biolab Central",
    estado_turno: "CONFIRMADO",
    via_reserva: "WEB_PACIENTE",
    creado_el: today.toISOString(),
    expira_el: today.toISOString(),
    pago: { monto_total: 12000, monto_pagado: 6000, checkout_id: "pref_bio1", estado_pago: "APROBADO" }
  });
  // Potenza Gym
  list.push({
    id: "potenza-1",
    paciente: clients[4],
    fecha: todayStr,
    hora_inicio: "18:00",
    hora_fin: "19:00",
    tipo_estudio: "Entrenamiento Funcional",
    consultorio: "Potenza Gym Central",
    estado_turno: "CONFIRMADO",
    via_reserva: "WEB_PACIENTE",
    creado_el: today.toISOString(),
    expira_el: today.toISOString(),
    pago: { monto_total: 8000, monto_pagado: 4000, checkout_id: "pref_pot1", estado_pago: "APROBADO" }
  });
  // Patagonia
  list.push({
    id: "patagonia-1",
    paciente: clients[5],
    fecha: todayStr,
    hora_inicio: "21:30",
    hora_fin: "23:00",
    tipo_estudio: "Hamburguesas",
    consultorio: "Refugio Patagonia SDE",
    estado_turno: "CONFIRMADO",
    via_reserva: "WEB_PACIENTE",
    creado_el: today.toISOString(),
    expira_el: today.toISOString(),
    pago: { monto_total: 22000, monto_pagado: 11000, checkout_id: "pref_pat1", estado_pago: "APROBADO" }
  });
  // Instituto Dao
  list.push({
    id: "dao-1",
    paciente: clients[6],
    fecha: todayStr,
    hora_inicio: "17:00",
    hora_fin: "19:00",
    tipo_estudio: "Medicina China Nivel 1",
    consultorio: "Sede Dao Banda",
    estado_turno: "CONFIRMADO",
    via_reserva: "WEB_PACIENTE",
    creado_el: today.toISOString(),
    expira_el: today.toISOString(),
    pago: { monto_total: 40000, monto_pagado: 20000, checkout_id: "pref_dao1", estado_pago: "APROBADO" }
  });
  // Cabañas Tafí
  list.push({
    id: "cabanas-1",
    paciente: clients[7],
    fecha: tomorrowStr,
    hora_inicio: "12:00",
    hora_fin: "12:00",
    tipo_estudio: "Cabaña Familiar 4 pers",
    consultorio: "Complejo Cabañas Tafí",
    estado_turno: "CONFIRMADO",
    via_reserva: "WEB_PACIENTE",
    creado_el: today.toISOString(),
    expira_el: today.toISOString(),
    pago: { monto_total: 95000, monto_pagado: 47500, checkout_id: "pref_cab1", estado_pago: "APROBADO" }
  });
  // Flores Odontología
  list.push({
    id: "flores-1",
    paciente: clients[2],
    fecha: tomorrowStr,
    hora_inicio: "16:00",
    hora_fin: "16:30",
    tipo_estudio: "Limpieza Dental",
    consultorio: "Consultorio Flores",
    estado_turno: "CONFIRMADO",
    via_reserva: "WEB_PACIENTE",
    creado_el: today.toISOString(),
    expira_el: today.toISOString(),
    pago: { monto_total: 28000, monto_pagado: 14000, checkout_id: "pref_flo1", estado_pago: "APROBADO" }
  });

  return list;
};

const isBrowser = typeof window !== "undefined";

const getDB = (key: string, initial: any) => {
  if (!isBrowser) return initial;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
};

const saveDB = (key: string, data: any) => {
  if (isBrowser) {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

export const mockDB = {
  // Global SaaS variables
  getSaaSConfig: (): GlobalSaaSConfig => {
    return getDB("zuma_saas_global_config", DEFAULT_SAAS_CONFIG);
  },

  saveSaaSConfig: (config: GlobalSaaSConfig) => {
    saveDB("zuma_saas_global_config", config);
  },

  // Partners list
  getPartners: (): Partner[] => {
    const list = getDB("zuma_partners", INITIAL_PARTNERS);
    if (list.some((p: any) => p.id === "megagimnasio-banda") || !list.some((p: any) => p.category === "Profesionales")) {
      saveDB("zuma_partners", INITIAL_PARTNERS);
      return INITIAL_PARTNERS;
    }
    return list;
  },

  savePartners: (partners: Partner[]) => {
    saveDB("zuma_partners", partners);
  },

  addPartner: (partner: Partner) => {
    const list = mockDB.getPartners();
    list.push(partner);
    saveDB("zuma_partners", list);
  },

  getMedicoConfig: (): MedicoConfig => {
    return getDB("zuma_medico_config", INITIAL_MEDICO_CONFIG);
  },

  saveMedicoConfig: (config: MedicoConfig) => {
    saveDB("zuma_medico_config", config);
    // Sync to Dr Carlos Jensen profile
    const partners = mockDB.getPartners();
    const idx = partners.findIndex(p => p.id === "dr-carlos-jensen");
    if (idx !== -1) {
      partners[idx].name = config.nombre;
      partners[idx].bio = config.especialidad;
      saveDB("zuma_partners", partners);
    }
  },

  // Turnos bookings list
  // Turnos bookings list
  getTurnos: (): MockTurno[] => {
    const list = getDB("zuma_turnos", getPreloadedTurnos());
    if (list.length < 15) {
      const freshList = getPreloadedTurnos();
      saveDB("zuma_turnos", freshList);
      return freshList;
    }
    return list;
  },

  saveTurnos: (turnos: MockTurno[]) => {
    saveDB("zuma_turnos", turnos);
  },

  addTurno: (turno: Omit<MockTurno, "id" | "creado_el" | "expira_el">) => {
    const list = mockDB.getTurnos();
    const now = new Date();
    const expira = turno.via_reserva === "SECRETARIA" 
      ? addDays(now, 365)
      : new Date(now.getTime() + 15 * 60 * 1000);

    const newTurno: MockTurno = {
      ...turno,
      id: `turno_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      creado_el: now.toISOString(),
      expira_el: expira.toISOString(),
      pago: turno.pago || {
        monto_total: 30000,
        monto_pagado: 15000,
        checkout_id: `pref_${Math.random().toString(36).substring(2, 7)}`,
        estado_pago: "PENDIENTE"
      }
    };

    list.push(newTurno);
    saveDB("zuma_turnos", list);
    return newTurno;
  },

  updateTurnoStatus: (turnoId: string, status: MockTurno["estado_turno"]) => {
    const list = mockDB.getTurnos();
    const idx = list.findIndex(t => t.id === turnoId);
    if (idx !== -1) {
      list[idx].estado_turno = status;
      if (status === "ATENDIDO") {
        if (list[idx].pago) list[idx].pago!.estado_pago = "APROBADO";
      } else if (status === "CANCELADO_MEDICO") {
        if (list[idx].pago) list[idx].pago!.estado_pago = "REEMBOLSADO";
      } else if (status === "CANCELADO_PACIENTE") {
        if (list[idx].pago) list[idx].pago!.estado_pago = "RECHAZADO";
      }
      saveDB("zuma_turnos", list);
      return list[idx];
    }
    return null;
  },

  // Coupons list
  getCoupons: (): MockCoupon[] => {
    return getDB("zuma_coupons", INITIAL_COUPONS);
  },

  saveCoupons: (coupons: MockCoupon[]) => {
    saveDB("zuma_coupons", coupons);
  },

  addCoupon: (coupon: MockCoupon) => {
    const list = mockDB.getCoupons();
    const idx = list.findIndex(c => c.code.toUpperCase() === coupon.code.toUpperCase() && c.partnerId === coupon.partnerId);
    if (idx !== -1) {
      list[idx] = coupon;
    } else {
      list.push(coupon);
    }
    saveDB("zuma_coupons", list);
  },

  // Chat messages
  getMessages: (): MockChatMessage[] => {
    return getDB("zuma_messages", INITIAL_CHAT_MESSAGES);
  },

  saveMessages: (messages: MockChatMessage[]) => {
    saveDB("zuma_messages", messages);
  },

  addMessage: (msg: MockChatMessage) => {
    const list = mockDB.getMessages();
    list.push(msg);
    saveDB("zuma_messages", list);
  },

  runCronCleanup: () => {
    const list = mockDB.getTurnos();
    let cleaned = 0;
    const nowStr = new Date().toISOString();

    const nextList = list.map(t => {
      if (t.estado_turno === "PRE_RESERVADO" && t.expira_el <= nowStr) {
        cleaned++;
        return {
          ...t,
          estado_turno: "CANCELADO_PACIENTE" as const,
          pago: t.pago ? { ...t.pago, estado_pago: "RECHAZADO" as const } : undefined
        };
      }
      return t;
    });

    saveDB("zuma_turnos", nextList);
    return cleaned;
  }
};
