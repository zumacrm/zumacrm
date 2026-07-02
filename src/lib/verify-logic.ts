import "dotenv/config";
import { prisma } from "./db";
import { parse, addMinutes, format } from "date-fns";

// Mock helper to simulate pre-reservar logic directly using DB transactions
async function testPreReserva(fechaStr: string, horaStr: string, dni: string, studyType: string) {
  const targetDate = new Date(fechaStr + "T00:00:00");
  const studyDuration = studyType === "Electrocardiograma" ? 15 : 30; // simplify for test
  
  const parsedTime = parse(horaStr, "HH:mm", new Date());
  const hora_fin = format(addMinutes(parsedTime, studyDuration), "HH:mm");

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Overlap check
      const dayTurnos = await tx.turno.findMany({
        where: {
          fecha: targetDate,
          estado_turno: { in: ["PRE_RESERVADO", "CONFIRMADO"] }
        }
      });

      const now = new Date();
      const isOverlap = dayTurnos.some((t) => {
        if (t.estado_turno === "PRE_RESERVADO" && new Date(t.expira_el) <= now) {
          return false; // ignore expired locks
        }
        return horaStr < t.hora_fin && hora_fin > t.hora_inicio;
      });

      if (isOverlap) {
        throw new Error("SLOT_OCCUPIED");
      }

      // Upsert patient
      const paciente = await tx.paciente.upsert({
        where: { dni },
        update: { nombre: "Test", apellido: "User", telefono: "+5491100000", email: "test@verify.com", obra_social: "Particular" },
        create: { dni, nombre: "Test", apellido: "User", telefono: "+5491100000", email: "test@verify.com", obra_social: "Particular" }
      });

      // Create Turno
      const turno = await tx.turno.create({
        data: {
          paciente_id: paciente.id,
          fecha: targetDate,
          hora_inicio: horaStr,
          hora_fin,
          tipo_estudio: studyType,
          consultorio: "Sanatorio Central Banda",
          estado_turno: "PRE_RESERVADO",
          via_reserva: "WEB_PACIENTE",
          expira_el: addMinutes(new Date(), 15)
        }
      });

      // Create Pago
      const pago = await tx.pagoSenia.create({
        data: {
          turno_id: turno.id,
          monto_total: 30000,
          monto_pagado: 15000,
          checkout_id: `pref_test_${Math.random().toString(36).substring(2, 7)}`,
          estado_pago: "PENDIENTE"
        }
      });

      return { turno, pago };
    });
    
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Mock helper to simulate webhook
async function testWebhook(checkoutId: string) {
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const pago = await tx.pagoSenia.findUnique({
        where: { checkout_id: checkoutId }
      });
      if (!pago) throw new Error("Payment record not found");

      await tx.pagoSenia.update({
        where: { id: pago.id },
        data: { estado_pago: "APROBADO" }
      });

      const turno = await tx.turno.update({
        where: { id: pago.turno_id },
        data: { estado_turno: "CONFIRMADO" }
      });

      return { turno, status: "CONFIRMADO" };
    });
    return { success: true, ...updated };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Mock helper to simulate cleanup cron
async function testCleanupCron() {
  const now = new Date();
  try {
    const expired = await prisma.turno.findMany({
      where: {
        estado_turno: "PRE_RESERVADO",
        expira_el: { lt: now }
      }
    });

    if (expired.length === 0) return { count: 0 };
    const ids = expired.map(t => t.id);

    await prisma.turno.updateMany({
      where: { id: { in: ids } },
      data: { estado_turno: "CANCELADO_PACIENTE" }
    });

    await prisma.pagoSenia.updateMany({
      where: { turno_id: { in: ids } },
      data: { estado_pago: "RECHAZADO" }
    });

    return { count: ids.length };
  } catch (err: any) {
    return { error: err.message };
  }
}

async function runTests() {
  console.log("=== STARTING INTEGRATION LOGIC VERIFICATION ===");
  const testFecha = "2026-08-10";
  const testHora = "10:30";

  // Clean old test turnos for this day
  await prisma.turno.deleteMany({
    where: { fecha: new Date(testFecha + "T00:00:00") }
  });
  console.log("Cleaned test date records.");

  // Test 1: Successful Pre-reservation
  console.log("\nTest 1: Booking slot 10:30...");
  const t1 = (await testPreReserva(testFecha, testHora, "99999999", "Consulta general")) as any;
  if (t1.success && t1.turno?.estado_turno === "PRE_RESERVADO") {
    console.log("✔ Slot successfully locked in PRE_RESERVADO state!");
    console.log(`  Turno ID: ${t1.turno.id}, Expira el: ${t1.turno.expira_el}`);
  } else {
    console.error("❌ Test 1 Failed:", t1.error);
    process.exit(1);
  }

  // Test 2: Overlapping Reservation (Double-booking Prevention)
  console.log("\nTest 2: Trying to book same slot (10:30) while lock is active...");
  const t2 = (await testPreReserva(testFecha, testHora, "88888888", "Consulta general")) as any;
  if (!t2.success && t2.error === "SLOT_OCCUPIED") {
    console.log("✔ Double-booking successfully blocked! Database transaction rolled back.");
  } else {
    console.error("❌ Test 2 Failed: Slot was double booked!", t2);
    process.exit(1);
  }

  // Test 3: Simulation of Cron Cleanup for Expired Lock
  console.log("\nTest 3: Backdating lock to simulate 15-minute expiration...");
  // Backdate the lock expiration to 5 minutes ago
  await prisma.turno.update({
    where: { id: t1.turno!.id },
    data: { expira_el: new Date(Date.now() - 5 * 60 * 1000) }
  });

  console.log("Running simulated Cron Cleanup...");
  const cronRes = (await testCleanupCron()) as any;
  if (cronRes.count === 1) {
    console.log("✔ Cron cleaned up and released the expired pre-reservation!");
    const checkTurno = await prisma.turno.findUnique({ where: { id: t1.turno!.id } });
    console.log(`  New Turno Status: ${checkTurno?.estado_turno}`); // Should be CANCELADO_PACIENTE
  } else {
    console.error("❌ Test 3 Failed to clean up expired slots:", cronRes);
    process.exit(1);
  }

  // Test 4: Webhook payment success transitions slot to CONFIRMADO
  console.log("\nTest 4: Re-booking the slot (now freed) and completing payment...");
  const t4 = (await testPreReserva(testFecha, testHora, "99999999", "Consulta general")) as any;
  if (t4.success && t4.pago) {
    console.log("Re-booked slot successfully. Triggering mock Webhook...");
    const webRes = (await testWebhook(t4.pago.checkout_id)) as any;
    if (webRes.success && webRes.status === "CONFIRMADO") {
      console.log("✔ Webhook processing successful! Turno status transitioned to CONFIRMADO!");
    } else {
      console.error("❌ Webhook test failed:", webRes.error);
      process.exit(1);
    }
  } else {
    console.error("❌ Re-booking for Webhook test failed:", t4.error);
    process.exit(1);
  }

  console.log("\n=== ALL LOGIC TESTS PASSED SUCCESSFULLY! ===");
  await prisma.$disconnect();
}

runTests();
