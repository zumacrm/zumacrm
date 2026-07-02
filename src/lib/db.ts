import "dotenv/config";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

let prisma: PrismaClient;

const getPrismaClient = () => {
  const dbUrl = process.env.DATABASE_URL || "";
  
  if (dbUrl.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: dbUrl });
  } else {
    // If we want a direct connection string, we can fallback to standard pg.
    // In our development setup, if it's the proxy, prisma+postgres:// is parsed by prisma client.
    // But if we want direct, we can replace it.
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }
};

if (process.env.NODE_ENV === "production") {
  prisma = getPrismaClient();
} else {
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
  };
  
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = getPrismaClient();
  }
  prisma = globalWithPrisma.prisma;
}

export { prisma };
