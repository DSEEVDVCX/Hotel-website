import { execSync } from "child_process";
import { existsSync } from "node:fs";
import { config } from "dotenv";

export default async function globalSetup() {
  if (existsSync(".env.test")) {
    config({ path: ".env.test" });
  } else {
    config();
  }

  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env },
  });

  execSync("npx tsx prisma/seed.ts", {
    stdio: "pipe",
    env: { ...process.env },
  });
}
