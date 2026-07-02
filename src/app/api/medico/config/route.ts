import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const config = await prisma.medicoConfig.findFirst();
    if (!config) {
      return NextResponse.json({ error: "Configuración médica no inicializada" }, { status: 404 });
    }
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("Error obteniendo configuración médica:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, especialidad, valor_consulta, porcentaje_senia, horario_atencion } = body;

    const currentConfig = await prisma.medicoConfig.findFirst();

    let updated;
    if (currentConfig) {
      updated = await prisma.medicoConfig.update({
        where: { id: currentConfig.id },
        data: {
          nombre: nombre ?? currentConfig.nombre,
          especialidad: especialidad ?? currentConfig.especialidad,
          valor_consulta: valor_consulta ?? currentConfig.valor_consulta,
          porcentaje_senia: porcentaje_senia ?? currentConfig.porcentaje_senia,
          horario_atencion: horario_atencion ?? currentConfig.horario_atencion,
        }
      });
    } else {
      updated = await prisma.medicoConfig.create({
        data: {
          nombre: nombre || "Dr. Carlos Jensen",
          especialidad: especialidad || "Cardiología clínica | Cardio metabolismo | Arritmias | Embarazo | Chagas",
          valor_consulta: valor_consulta || 30000.00,
          porcentaje_senia: porcentaje_senia || 50,
          horario_atencion: horario_atencion || {},
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Configuración médica guardada con éxito.",
      config: updated
    });
  } catch (error) {
    console.error("Error actualizando configuración médica:", error);
    return NextResponse.json({ error: "Error de servidor al guardar configuración." }, { status: 500 });
  }
}
