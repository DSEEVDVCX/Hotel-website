// Provisions the isolated test database used by the integration suite:
//   1. creates the database named in .env.test if it doesn't exist
//   2. applies migrations
//   3. seeds it
// Safe to re-run. The database name must contain "test".
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { Client } from "pg";

if (!existsSync(".env.test")) {
  console.error("Missing .env.test — copy .env.test.example to .env.test first.");
  process.exit(1);
}
config({ path: ".env.test" });

const url = process.env.DATABASE_URL ?? "";
const dbName = new URL(url).pathname.replace(/^\//, "").split("?")[0];
if (!/test/i.test(dbName)) {
  console.error(`Refusing: .env.test DATABASE_URL "${dbName}" is not a *test* database.`);
  process.exit(1);
}

async function ensureDatabase() {
  const admin = new URL(url);
  admin.pathname = "/postgres";
  admin.search = "";
  const c = new Client({ connectionString: admin.toString() });
  await c.connect();
  const { rows } = await c.query("SELECT 1 FROM pg_database WHERE datname=$1", [dbName]);
  if (rows.length === 0) {
    await c.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Created database ${dbName}`);
  } else {
    console.log(`Database ${dbName} already exists`);
  }
  await c.end();
}

async function main() {
  await ensureDatabase();
  const env = { ...process.env, DATABASE_URL: url };
  console.log("Applying migrations...");
  execFileSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", env, shell: true });
  console.log("Seeding...");
  execFileSync("npx", ["tsx", "prisma/seed.ts"], { stdio: "inherit", env, shell: true });
  console.log("Test database ready.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
