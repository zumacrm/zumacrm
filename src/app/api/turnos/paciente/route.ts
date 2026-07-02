import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dni = searchParams.get("dni");

    if (!dni) {
      return NextResponse.json({ error: "Faltan parámetros de búsqueda (dni)" }, { status: 400 });
    }

    // Find patient by DNI
    const paciente = await prisma.paciente.findUnique({
      where: { dni },
      include: {
        turnos: {
          include: {
            pago: true
          },
          orderBy: [
            { fecha: "desc" },
            { hora_inicio: "desc" }
          ]
        }
      }
    });

    if (!paciente) {
      return NextResponse.json({ success: true, turnos: [] }); // No patient profile means no turnos
    }

    return NextResponse.json({
      success: true,
      paciente: {
        id: paciente.id,
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        telefono: paciente.telefono,
        email: paciente.email
      },
      turnos: paciente.turnos
    });

  } catch (error) {
    console.error("Error buscando turnos del paciente:", error);
    return NextResponse.json({ error: "Error de servidor al buscar turnos." }, { status: 500 });
  }
}
