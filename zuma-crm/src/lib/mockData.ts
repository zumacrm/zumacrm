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

const DEFAULT_SAAS_CONFIG: GlobalSaaSConfig = {
  globalCommission: 10,
  bronzePrice: 29,
  goldPrice: 59,
  platinumPrice: 99
};

// Initial Partners list
const INITIAL_PARTNERS: Partner[] = [
  {
    id: "dr-carlos-jensen",
    name: "Dr. Carlos Jensen",
    category: "Médico Cardiólogo",
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
    category: "Análisis Clínicos",
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
    category: "Gimnasio y Fitness",
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
    category: "Gastronomía",
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

const getPreloadedTurnos = (): MockTurno[] => {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

  return [
    {
      id: "turno-1",
      paciente: {
        dni: "20444333",
        nombre: "Roberto",
        apellido: "Sosa",
        telefono: "+5493854111222",
        email: "roberto.sosa@gmail.com",
        obra_social: "OSDE"
      },
      fecha: todayStr,
      hora_inicio: "09:00",
      hora_fin: "09:30",
      tipo_estudio: "Consulta general",
      consultorio: "Sanatorio Central Banda",
      estado_turno: "CONFIRMADO",
      via_reserva: "WEB_PACIENTE",
      creado_el: new Date().toISOString(),
      expira_el: new Date().toISOString(),
      pago: {
        monto_total: 30000,
        monto_pagado: 15000,
        checkout_id: "pref_1a",
        estado_pago: "APROBADO"
      }
    },
    {
      id: "turno-2",
      paciente: {
        dni: "20444333",
        nombre: "Roberto",
        apellido: "Sosa",
        telefono: "+5493854111222",
        email: "roberto.sosa@gmail.com",
        obra_social: "OSDE"
      },
      fecha: todayStr,
      hora_inicio: "10:30",
      hora_fin: "11:00",
      tipo_estudio: "Electrocardiograma",
      consultorio: "Sanatorio Central Banda",
      estado_turno: "PRE_RESERVADO",
      via_reserva: "WEB_PACIENTE",
      creado_el: new Date().toISOString(),
      expira_el: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      pago: {
        monto_total: 24000,
        monto_pagado: 0,
        checkout_id: "pref_2b",
        estado_pago: "PENDIENTE"
      }
    }
  ];
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
    if (list.some((p: any) => p.id === "megagimnasio-banda" || p.id === "la-casona-restaurante")) {
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
  getTurnos: (): MockTurno[] => {
    return getDB("zuma_turnos", getPreloadedTurnos());
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
