import path from "node:path";
import type { PrismaConfig } from "prisma";

export default {
  schema: path.join("prisma", "schema.prisma"),

  migrations: {
    path: path.join("prisma", "migrations"),
  },

  // Pass the database URL to the migrate engine via the environment.
  // This replaces the old `url` in the `datasource` block.
} satisfies PrismaConfig;
