import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parse, addMinutes, format, isAfter, isBefore, isEqual, parseISO } from "date-fns";

const DIAS_MAP: Record<string, string> = {
  "0": "domingo",
  "1": "lunes",
  "2": "martes",
  "3": "miercoles",
  "4": "jueves",
  "5": "viernes",
  "6": "sabado"
};

// Helpers for study duration
function getStudyDuration(tipo: string): number {
  switch (tipo) {
    case "Electrocardiograma": return 15;
    case "Ergometría": return 45;
    case "Ecocardiograma": return 30;
    default: return 30; // Consulta general
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fechaStr = searchParams.get("fecha"); // e.g. "2026-07-01"
    const tipoEstudio = searchParams.get("tipo_estudio") || "Consulta general";
    const consultorio = searchParams.get("consultorio");

    if (!fechaStr) {
      return NextResponse.json({ error: "Falta parámetro fecha" }, { status: 400 });
    }
    if (!consultorio) {
      return NextResponse.json({ error: "Falta parámetro consultorio" }, { status: 400 });
    }

    const targetDate = new Date(fechaStr + "T00:00:00");
    const dayOfWeek = DIAS_MAP[targetDate.getDay().toString()];

    // 1. Fetch Doctor Config
    const config = await prisma.medicoConfig.findFirst();
    if (!config) {
      return NextResponse.json({ error: "Configuración médica no encontrada" }, { status: 500 });
    }

    // 2. Fetch Active Turnos for the day
    const dayTurnos = await prisma.turno.findMany({
      where: {
        fecha: targetDate,
        estado_turno: {
          in: ["PRE_RESERVADO", "CONFIRMADO", "ATENDIDO"]
        }
      }
    });

    const now = new Date();
    const activeBookings = dayTurnos.filter(t => {
      // Exclude expired pre-reservations
      if (t.estado_turno === "PRE_RESERVADO" && new Date(t.expira_el) <= now) {
        return false;
      }
      return true;
    });

    // 3. Get doctor working ranges for the day inside this specific location
    const schedule = config.horario_atencion as any;
    const locationSchedule = schedule[consultorio] || {};
    const dayRanges = locationSchedule[dayOfWeek] || [];

    if (dayRanges.length === 0) {
      return NextResponse.json({ slots: [] }); // Doctor doesn't work this day
    }

    const studyDuration = getStudyDuration(tipoEstudio);
    const availableSlots: string[] = [];

    // 4. Generate slots in 15-minute increments for each work range
    for (const range of dayRanges) {
      const startWork = parse(range.inicio, "HH:mm", targetDate);
      const endWork = parse(range.fin, "HH:mm", targetDate);

      let currentSlotTime = startWork;

      while (isBefore(currentSlotTime, endWork)) {
        const slotEnd = addMinutes(currentSlotTime, studyDuration);

        // Slot must end before or at the end of the work range
        if (isAfter(slotEnd, endWork)) {
          break;
        }

        const slotStartStr = format(currentSlotTime, "HH:mm");
        const slotEndStr = format(slotEnd, "HH:mm");

        // Check if slot overlaps with any active booking
        const isOverlap = activeBookings.some(t => {
          return slotStartStr < t.hora_fin && slotEndStr > t.hora_inicio;
        });

        // Filter out past slots if the target date is today
        const isToday = format(now, "yyyy-MM-dd") === fechaStr;
        let isPast = false;
        if (isToday) {
          const slotDateTime = parse(slotStartStr, "HH:mm", now);
          isPast = isBefore(slotDateTime, now);
        }

        if (!isOverlap && !isPast) {
          availableSlots.push(slotStartStr);
        }

        // Add 15 minutes to find the next candidate slot
        currentSlotTime = addMinutes(currentSlotTime, 15);
      }
    }

    return NextResponse.json({
      date: fechaStr,
      day: dayOfWeek,
      tipo_estudio: tipoEstudio,
      duration_minutes: studyDuration,
      slots: availableSlots
    });

  } catch (error) {
    console.error("Error obteniendo disponibilidad:", error);
    return NextResponse.json({ error: "Error calculando la disponibilidad." }, { status: 500 });
  }
}
