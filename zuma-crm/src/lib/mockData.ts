"use client";

import { format, addDays, subDays } from "date-fns";

export interface Partner {
  id: string;
  name: string;
  category: string;
  status: "active" | "pending" | "suspended";
  cuit: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  logoColor: string;
  joinedDate: string;
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
    address: "Sanatorio Central Banda / Clínica Del Pilar / Centro Médico Cannon",
    bio: "Especialista en cardiología clínica, arritmias, cardiometabolismo, control en embarazo y chagas.",
    logoColor: "bg-teal-500",
    joinedDate: "12/03/2026"
  },
  {
    id: "sanatorio-central-banda",
    name: "Sanatorio Central Banda",
    category: "Sanatorio y Prácticas",
    status: "active",
    cuit: "30-55443322-1",
    email: "administracion@sanatoriocentral.com",
    phone: "+5493854221100",
    address: "España 150, La Banda",
    bio: "Sanatorio de alta complejidad y consultorios integrados en la ciudad de La Banda.",
    logoColor: "bg-blue-500",
    joinedDate: "15/03/2026"
  },
  {
    id: "clinica-del-pilar",
    name: "Clínica Del Pilar",
    category: "Clínica Privada",
    status: "active",
    cuit: "30-77665544-2",
    email: "contacto@clinicadelpilar.com",
    phone: "+5493854212121",
    address: "Pellegrini 350, Santiago del Estero",
    bio: "Clínica especializada en atención ambulatoria y diagnóstico cardiológico.",
    logoColor: "bg-indigo-500",
    joinedDate: "18/03/2026"
  },
  {
    id: "laboratorios-biolab",
    name: "Laboratorios Biolab",
    category: "Análisis Clínicos",
    status: "pending",
    cuit: "30-99887766-3",
    email: "bioquimica@biolab.com",
    phone: "+5493854332211",
    address: "Av. Belgrano Norte 450, Santiago",
    bio: "Laboratorio bioquímico avanzado para estudios clínicos y genéticos.",
    logoColor: "bg-emerald-500",
    joinedDate: "20/06/2026"
  },
  {
    id: "megagimnasio-banda",
    name: "MegaGimnasio Banda",
    category: "Gimnasio y Fitness",
    status: "active",
    cuit: "20-22114433-8",
    email: "fitness@megagimnasio.com",
    phone: "+5493856443322",
    address: "Aristóbulo del Valle 240, La Banda",
    bio: "Centro de entrenamiento de alto rendimiento, musculación y clases grupales.",
    logoColor: "bg-orange-500",
    joinedDate: "05/04/2026"
  },
  {
    id: "la-casona-restaurante",
    name: "La Casona Restaurante",
    category: "Gastronomía",
    status: "active",
    cuit: "23-28492049-9",
    email: "reservas@lacasona.com",
    phone: "+5493854245678",
    address: "Av. Belgrano Sur 1400, Santiago",
    bio: "Restaurante de comida tradicional, parrilla y eventos corporativos.",
    logoColor: "bg-rose-500",
    joinedDate: "12/05/2026"
  },
  {
    id: "prof-maria-rossi",
    name: "Prof. María Rossi",
    category: "Profesor / Idiomas",
    status: "suspended",
    cuit: "27-25123987-4",
    email: "maria.rossi.english@gmail.com",
    phone: "+5493855123456",
    address: "Sáenz Peña 120, Santiago",
    bio: "Clases particulares de inglés de negocios y preparación para exámenes internacionales.",
    logoColor: "bg-red-500",
    joinedDate: "22/03/2026"
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

// Generate preloaded appointments for tests
const getPreloadedTurnos = (): MockTurno[] => {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");

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
        dni: "35999888",
        nombre: "Estela",
        apellido: "Gomez",
        telefono: "+5493855888999",
        email: "estelag@hotmail.com",
        obra_social: "Swiss Medical"
      },
      fecha: todayStr,
      hora_inicio: "10:30",
      hora_fin: "11:00",
      tipo_estudio: "Electrocardiograma",
      consultorio: "Sanatorio Central Banda",
      estado_turno: "CONFIRMADO",
      via_reserva: "WEB_PACIENTE",
      creado_el: new Date().toISOString(),
      expira_el: new Date().toISOString(),
      pago: {
        monto_total: 24000,
        monto_pagado: 12000,
        checkout_id: "pref_2b",
        estado_pago: "APROBADO"
      }
    },
    {
      id: "turno-3",
      paciente: {
        dni: "41000111",
        nombre: "Lucas",
        apellido: "Benitez",
        telefono: "+5493856222333",
        email: "lucasb@live.com.ar",
        obra_social: "Particular"
      },
      fecha: todayStr,
      hora_inicio: "15:00",
      hora_fin: "15:45",
      tipo_estudio: "Ergometría",
      consultorio: "Sanatorio Central Banda",
      estado_turno: "PRE_RESERVADO",
      via_reserva: "WEB_PACIENTE",
      creado_el: new Date().toISOString(),
      expira_el: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // expires in 10 mins
      pago: {
        monto_total: 45000,
        monto_pagado: 22500,
        checkout_id: "pref_3c",
        estado_pago: "PENDIENTE"
      }
    },
    {
      id: "turno-4",
      paciente: {
        dni: "18222333",
        nombre: "Clara",
        apellido: "Mendez",
        telefono: "+5493854999000",
        email: "clarita.m@gmail.com",
        obra_social: "Particular"
      },
      fecha: tomorrowStr,
      hora_inicio: "10:00",
      hora_fin: "10:30",
      tipo_estudio: "Ecocardiograma",
      consultorio: "Clínica Del Pilar",
      estado_turno: "CONFIRMADO",
      via_reserva: "SECRETARIA",
      creado_el: new Date().toISOString(),
      expira_el: new Date().toISOString(),
      pago: {
        monto_total: 36000,
        monto_pagado: 0,
        checkout_id: "PAGA_EN_CONSULTORIO",
        estado_pago: "PENDIENTE"
      }
    }
  ];
};

// Database Initializer (LocalStorage Helper)
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

// Exposed API functions
export const mockDB = {
  getPartners: (): Partner[] => {
    return getDB("zuma_partners", INITIAL_PARTNERS);
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
    // Also sync names in partners list
    const partners = mockDB.getPartners();
    const index = partners.findIndex(p => p.id === "dr-carlos-jensen");
    if (index !== -1) {
      partners[index].name = config.nombre;
      partners[index].bio = config.especialidad;
      saveDB("zuma_partners", partners);
    }
  },

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
      ? addDays(now, 365) // placeholder for manual
      : new Date(now.getTime() + 15 * 60 * 1000); // 15 mins lock

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
        if (list[idx].pago) {
          list[idx].pago!.estado_pago = "APROBADO";
        }
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
