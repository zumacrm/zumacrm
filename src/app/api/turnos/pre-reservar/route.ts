import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parse, addMinutes, format } from "date-fns";

// Helpers for study duration and pricing
function getStudyDetails(tipo: string, basePrice: number) {
  let minutes = 30;
  let price = basePrice;

  switch (tipo) {
    case "Electrocardiograma":
      minutes = 15;
      price = basePrice * 0.8;
      break;
    case "Ergometría":
      minutes = 45;
      price = basePrice * 1.5;
      break;
    case "Ecocardiograma":
      minutes = 30;
      price = basePrice * 1.2;
      break;
    default:
      // Consulta general or other
      minutes = 30;
      price = basePrice;
      break;
  }

  return { minutes, price };
}

function calculateEndTime(startTimeStr: string, minutes: number): string {
  const parsedTime = parse(startTimeStr, "HH:mm", new Date());
  const endTime = addMinutes(parsedTime, minutes);
  return format(endTime, "HH:mm");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fecha, hora_inicio, tipo_estudio, paciente, via_reserva, paga_en_consultorio, consultorio } = body;

    // Validation
    if (!fecha || !hora_inicio || !tipo_estudio || !paciente || !via_reserva || !consultorio) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (fecha, hora_inicio, tipo_estudio, paciente, via_reserva)" },
        { status: 400 }
      );
    }

    const { dni, nombre, apellido, telefono, email, obra_social } = paciente;
    if (!dni || !nombre || !apellido || !telefono || !email) {
      return NextResponse.json(
        { error: "Faltan datos personales del paciente (dni, nombre, apellido, telefono, email)" },
        { status: 400 }
      );
    }

    // Retrieve doctor config (there's only one in this single-doctor turnero)
    const config = await prisma.medicoConfig.findFirst();
    if (!config) {
      return NextResponse.json(
        { error: "La configuración del médico no se ha encontrado. Inicialice el sistema." },
        { status: 500 }
      );
    }

    const basePrice = Number(config.valor_consulta);
    const { minutes, price: totalVal } = getStudyDetails(tipo_estudio, basePrice);
    const hora_fin = calculateEndTime(hora_inicio, minutes);

    const targetDate = new Date(fecha);
    const seniaPercent = config.porcentaje_senia;
    const seniaAmount = (totalVal * seniaPercent) / 100;

    // Database transaction to enforce slot locks and avoid double bookings
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get all active slots for this day to perform overlap checks
      const dayTurnos = await tx.turno.findMany({
        where: {
          fecha: targetDate,
          estado_turno: {
            in: ["PRE_RESERVADO", "CONFIRMADO", "ATENDIDO"],
          },
        },
      });

      // 2. Check for slot overlaps (excluding expired pre-reservations)
      const now = new Date();
      const isOverlap = dayTurnos.some((t) => {
        if (t.estado_turno === "PRE_RESERVADO" && new Date(t.expira_el) <= now) {
          return false; // Skip expired reservations
        }
        // Overlap occurs if: startA < endB AND endA > startB
        return hora_inicio < t.hora_fin && hora_fin > t.hora_inicio;
      });

      if (isOverlap) {
        throw new Error("SLOT_OCCUPIED");
      }

      // 3. Upsert patient profile by DNI
      const pacienteDb = await tx.paciente.upsert({
        where: { dni },
        update: { nombre, apellido, telefono, email, obra_social: obra_social || "Particular" },
        create: { dni, nombre, apellido, telefono, email, obra_social: obra_social || "Particular" },
      });

      // 4. Setup reservation timing and flags
      const isManualDirect = via_reserva === "SECRETARIA" && paga_en_consultorio;
      const estado_turno = isManualDirect ? "CONFIRMADO" : "PRE_RESERVADO";
      
      const creado_el = new Date();
      const expira_el = isManualDirect 
        ? addMinutes(creado_el, 525600) // 1 year placeholder expiration for manuals
        : addMinutes(creado_el, 15); // 15 mins countdown for patient booking

      // 5. Create Turno
      const newTurno = await tx.turno.create({
        data: {
          paciente_id: pacienteDb.id,
          fecha: targetDate,
          hora_inicio,
          hora_fin,
          tipo_estudio,
          consultorio,
          estado_turno,
          via_reserva,
          creado_el,
          expira_el,
        },
        include: {
          paciente: true
        }
      });

      // 6. Create PagoSenia
      const checkout_id = isManualDirect ? "PAGA_EN_CONSULTORIO" : `pref_${Math.random().toString(36).substring(2, 15)}`;
      const estado_pago = isManualDirect ? "PENDIENTE" : "PENDIENTE";

      const newPago = await tx.pagoSenia.create({
        data: {
          turno_id: newTurno.id,
          monto_total: totalVal,
          monto_pagado: isManualDirect ? 0 : seniaAmount,
          checkout_id,
          estado_pago,
        },
      });

      return { turno: newTurno, pago: newPago };
    });

    // Generate link for payment checkout
    const isManualDirect = via_reserva === "SECRETARIA" && paga_en_consultorio;
    const checkoutUrl = isManualDirect 
      ? null 
      : `/pago/simular?checkoutId=${result.pago.checkout_id}&turnoId=${result.turno.id}`;

    return NextResponse.json({
      success: true,
      message: isManualDirect ? "Turno reservado manualmente con éxito." : "Turno pre-reservado por 15 minutos.",
      turno: result.turno,
      pago: result.pago,
      checkoutUrl,
      expira_el: result.turno.expira_el.toISOString()
    });

  } catch (error: any) {
    if (error.message === "SLOT_OCCUPIED") {
      return NextResponse.json(
        { error: "El horario seleccionado ya no está disponible. Por favor elija otro." },
        { status: 409 }
      );
    }
    console.error("Error pre-reservando turno:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al procesar la pre-reserva." },
      { status: 500 }
    );
  }
}
