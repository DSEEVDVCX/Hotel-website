import { execSync } from "child_process";

export default async function globalSetup() {
  execSync("npx tsx prisma/seed.ts", {
    stdio: "pipe",
    env: { ...process.env },
  });
}
