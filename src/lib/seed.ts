import { prisma } from "./db";

async function main() {
  try {
    console.log("Seeding database...");
    
        // Clear old config and insert new one
    await prisma.medicoConfig.deleteMany();
    console.log("Cleared old medico configs.");

    const newConfig = await prisma.medicoConfig.create({
      data: {
        nombre: "Dr. Carlos Jensen",
        especialidad: "Cardiología clínica | Cardio metabolismo | Arritmias | Embarazo | Chagas",
        valor_consulta: 30000.00, // ARS 30,000 consult price
        porcentaje_senia: 50,      // 50% deposit required
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
      }
    });

    console.log("Seeded default medico config:", newConfig);
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
