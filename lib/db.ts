import { PrismaClient } from "@prisma/client";

let _prisma: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (_prisma) return _prisma;
  const { Pool } = require("pg");
  const { PrismaPg } = require("@prisma/adapter-pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  _prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  if (process.env.NODE_ENV !== "production") {
    (globalThis as Record<string, unknown>).__prisma = _prisma;
  }
  return _prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string) {
    const client = getClient();
    const value = client[prop as keyof PrismaClient] as unknown;
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});
