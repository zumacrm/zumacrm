import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fechaStr = searchParams.get("fecha"); // "YYYY-MM-DD"
    const startStr = searchParams.get("start"); // Range start "YYYY-MM-DD"
    const endStr = searchParams.get("end");     // Range end "YYYY-MM-DD"

    let whereClause: any = {};

    if (fechaStr) {
      whereClause.fecha = new Date(fechaStr + "T00:00:00");
    } else if (startStr && endStr) {
      whereClause.fecha = {
        gte: new Date(startStr + "T00:00:00"),
        lte: new Date(endStr + "T23:59:59")
      };
    }

    const turnos = await prisma.turno.findMany({
      where: whereClause,
      include: {
        paciente: true,
        pago: true
      },
      orderBy: [
        { fecha: "asc" },
        { hora_inicio: "asc" }
      ]
    });

    return NextResponse.json({ success: true, turnos });
  } catch (error) {
    console.error("Error obteniendo turnos admin:", error);
    return NextResponse.json({ error: "Error de servidor al buscar turnos." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { turnoId, estado, fecha, hora_inicio, hora_fin, consultorio } = body;

    if (!turnoId) {
      return NextResponse.json({ error: "Falta turnoId" }, { status: 400 });
    }

    // Find current appointment
    const currentTurno = await prisma.turno.findUnique({
      where: { id: turnoId },
      include: { pago: true }
    });

    if (!currentTurno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    // If rescheduling, check availability
    let updateData: any = {};
    if (estado) {
      updateData.estado_turno = estado;
      
      // Update payment state if cancelled
      if (estado.startsWith("CANCELADO_") && currentTurno.pago) {
        await prisma.pagoSenia.update({
          where: { turno_id: turnoId },
          data: {
            estado_pago: estado === "CANCELADO_MEDICO" ? "REEMBOLSADO" : "RECHAZADO"
          }
        });
      }
    }

    if (fecha && hora_inicio) {
      const targetDate = new Date(fecha);
      const studyEnd = hora_fin || currentTurno.hora_fin;

      // Overlap check
      const dayTurnos = await prisma.turno.findMany({
        where: {
          fecha: targetDate,
          estado_turno: {
            in: ["PRE_RESERVADO", "CONFIRMADO", "ATENDIDO"]
          },
          id: {
            not: turnoId // Exclude self
          }
        }
      });

      const now = new Date();
      const isOverlap = dayTurnos.some(t => {
        if (t.estado_turno === "PRE_RESERVADO" && new Date(t.expira_el) <= now) {
          return false;
        }
        return hora_inicio < t.hora_fin && studyEnd > t.hora_inicio;
      });

      if (isOverlap) {
        return NextResponse.json({ error: "El nuevo slot seleccionado está ocupado" }, { status: 409 });
      }

      updateData.fecha = targetDate;
      updateData.hora_inicio = hora_inicio;
      updateData.hora_fin = studyEnd;
    }

    if (consultorio) {
      updateData.consultorio = consultorio;
    }

    const updated = await prisma.turno.update({
      where: { id: turnoId },
      data: updateData,
      include: {
        paciente: true,
        pago: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Turno actualizado exitosamente por administración.",
      turno: updated
    });

  } catch (error) {
    console.error("Error actualizando turno admin:", error);
    return NextResponse.json({ error: "Error de servidor al modificar turno." }, { status: 500 });
  }
}
