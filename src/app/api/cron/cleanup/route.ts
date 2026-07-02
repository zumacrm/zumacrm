import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    
    // In production, we'd verify a secret token to protect this route
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Find all expired pre-reservations
      const expiredTurnos = await tx.turno.findMany({
        where: {
          estado_turno: "PRE_RESERVADO",
          expira_el: {
            lt: now,
          },
        },
      });

      if (expiredTurnos.length === 0) {
        return { count: 0 };
      }

      const expiredIds = expiredTurnos.map((t) => t.id);

      // Cancel the appointments
      const updatedTurnos = await tx.turno.updateMany({
        where: {
          id: { in: expiredIds },
        },
        data: {
          estado_turno: "CANCELADO_PACIENTE", // Mark as canceled by client (due to timeout)
        },
      });

      // Update related payments to RECHAZADO
      await tx.pagoSenia.updateMany({
        where: {
          turno_id: { in: expiredIds },
          estado_pago: "PENDIENTE",
        },
        data: {
          estado_pago: "RECHAZADO",
        },
      });

      return { count: expiredIds.length, turnos: expiredTurnos };
    });

    console.log(`[CRON CLEANUP] Se liberaron ${result.count} turnos expirados a las ${now.toISOString()}`);
    
    return NextResponse.json({
      success: true,
      released_count: result.count,
      message: `Se liberaron ${result.count} turnos que expiraron sin abonar la seña.`,
    });

  } catch (error) {
    console.error("Error en script de limpieza de turnos expirados:", error);
    return NextResponse.json(
      { error: "Error procesando la limpieza de slots expirados." },
      { status: 500 }
    );
  }
}
