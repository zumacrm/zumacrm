import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { EstadoPago, EstadoTurno } from "@/generated/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { checkoutId, status, paymentId } = body;

    if (!checkoutId || !status) {
      return NextResponse.json(
        { error: "Faltan campos checkoutId o status en la notificación de pago" },
        { status: 400 }
      );
    }

    // Process inside a transaction
    const updateResult = await prisma.$transaction(async (tx) => {
      // Find the payment record
      const pago = await tx.pagoSenia.findUnique({
        where: { checkout_id: checkoutId },
        include: {
          turno: {
            include: {
              paciente: true,
            },
          },
        },
      });

      if (!pago) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      // Check if already approved to avoid double processing
      if (pago.estado_pago === "APROBADO") {
        return { alreadyProcessed: true, turno: pago.turno, pago };
      }

      let nuevoEstadoPago: EstadoPago = pago.estado_pago as EstadoPago;
      let nuevoEstadoTurno: EstadoTurno = pago.turno.estado_turno as EstadoTurno;

      if (status === "approved" || status === "success") {
        nuevoEstadoPago = "APROBADO";
        nuevoEstadoTurno = "CONFIRMADO";
      } else if (status === "rejected" || status === "failure") {
        nuevoEstadoPago = "RECHAZADO";
        nuevoEstadoTurno = "PRE_RESERVADO"; // Keep pre-reserved to let them retry within time, or let cleanup run
      }

      // Update payment record
      const updatedPago = await tx.pagoSenia.update({
        where: { id: pago.id },
        data: {
          estado_pago: nuevoEstadoPago,
          monto_pagado: status === "approved" || status === "success" ? pago.monto_pagado : 0,
        },
      });

      // Update appointment status
      const updatedTurno = await tx.turno.update({
        where: { id: pago.turno_id },
        data: {
          estado_turno: nuevoEstadoTurno,
        },
        include: {
          paciente: true,
        },
      });

      return { alreadyProcessed: false, turno: updatedTurno, pago: updatedPago };
    });

    const { turno, pago: updatedPago } = updateResult;

    if (status === "approved" || status === "success") {
      // Format details for the logs and templates
      const fechaFormateada = format(new Date(turno.fecha), "dd/MM/yyyy");
      const phoneClean = turno.paciente.telefono.replace(/\s+/g, "").replace("+", "");

      // 1. Simulate WhatsApp Twilio Notification
      const whatsappLog = `
========================================
[TWILIO WHATSAPP OUTGOING API SIMULATION]
To: whatsapp:+${phoneClean} (${turno.paciente.nombre} ${turno.paciente.apellido})
Message:
¡Hola ${turno.paciente.nombre}! Tu turno con el Dr. Carlos Jensen para "${turno.tipo_estudio}" el día ${fechaFormateada} a las ${turno.hora_inicio} hs ha sido CONFIRMADO.
Hemos registrado el pago de la seña por $${updatedPago.monto_pagado} (ID Pago: ${paymentId || "sim_123"}).
Centros: Sanatorio Central Banda · Clínica Del Pilar · Centro Médico Cannon.
Si necesitas reprogramar o cancelar, puedes hacerlo desde tu panel "Mis Turnos" hasta 24 horas antes del turno.
========================================
`;
      console.log(whatsappLog);

      // 2. Simulate Nodemailer Email Notification
      const emailLog = `
========================================
[NODEMAILER EMAIL SERVICE SIMULATION]
From: turnos@consultorio-carlosjensen.com
To: ${turno.paciente.email}
Subject: Confirmación de Turno Médico - Dr. Carlos Jensen
Body:
Estimado/a ${turno.paciente.nombre} ${turno.paciente.apellido},

Le informamos que su turno para el estudio "${turno.tipo_estudio}" ha sido CONFIRMADO exitosamente.
Detalles del Turno:
- Doctor: Dr. Carlos Jensen
- Especialidad: Cardiología clínica | Cardio metabolismo | Arritmias | Embarazo | Chagas
- Fecha: ${fechaFormateada}
- Horario: ${turno.hora_inicio} hs
- Seña Abonada: $${updatedPago.monto_pagado}
- Saldo Restante en Consultorio: $${Number(updatedPago.monto_total) - Number(updatedPago.monto_pagado)}

Lugar de Atención: Sanatorio Central Banda · Clínica Del Pilar · Centro Médico Cannon

Política de cancelación: Puede cancelar su turno con reintegro de seña o re-programación sin cargos adicionales hasta 24 horas hábiles antes de su cita. Pasado este período, la seña no será reembolsable.

Atentamente,
Administración Consultorio Dr. Carlos Jensen
========================================
`;
      console.log(emailLog);

      return NextResponse.json({
        success: true,
        message: "Turno confirmado y notificaciones enviadas.",
        status: "CONFIRMADO",
        notifications: {
          whatsapp: `Enviado a +${phoneClean}`,
          email: `Enviado a ${turno.paciente.email}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Estado de pago actualizado a ${updatedPago.estado_pago}. El turno permanece como ${turno.estado_turno}.`,
      status: turno.estado_turno,
    });

  } catch (error: any) {
    if (error.message === "PAYMENT_NOT_FOUND") {
      return NextResponse.json({ error: "El identificador de checkout no coincide con ningún pago pendiente." }, { status: 404 });
    }
    console.error("Error en webhook de pagos:", error);
    return NextResponse.json({ error: "Ocurrió un error al procesar el webhook." }, { status: 500 });
  }
}
