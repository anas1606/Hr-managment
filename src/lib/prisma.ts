import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function isHealthy(client: PrismaClient | undefined): client is PrismaClient {
  return (
    !!client &&
    typeof (client as unknown as { staffDocument?: { findMany?: unknown } })
      .staffDocument?.findMany === "function" &&
    typeof (client as unknown as { salarySlip?: { findMany?: unknown } })
      .salarySlip?.findMany === "function"
  );
}

function getClient(): PrismaClient {
  if (isHealthy(globalForPrisma.prisma)) {
    return globalForPrisma.prisma;
  }

  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect().catch(() => undefined);
  }

  const client = createClient();
  globalForPrisma.prisma = client;
  return client;
}

/** Lazy proxy so HMR always hits a client that includes latest models. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
