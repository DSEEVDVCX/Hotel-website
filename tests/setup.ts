// Loads test environment BEFORE any test module imports "@/lib/db".
// Prefers .env.test (isolated test database) and falls back to .env.
// Hard safety guard: refuses to run integration tests against a non-test DB,
// because they call deleteMany() on core tables in beforeEach.
import { config } from "dotenv";
import { existsSync } from "node:fs";

if (existsSync(".env.test")) {
  config({ path: ".env.test" });
} else {
  config();
}

const url = process.env.DATABASE_URL ?? "";
// Only enforce the guard when a DB is configured and tests will touch it.
if (url) {
  let dbName = "";
  try {
    dbName = new URL(url).pathname.replace(/^\//, "").split("?")[0];
  } catch {
    dbName = "";
  }
  if (!/test/i.test(dbName)) {
    throw new Error(
      `Refusing to run tests against database "${dbName}". ` +
        `Integration tests wipe core tables — point DATABASE_URL at a *_test database ` +
        `(create .env.test). Current target is not a test database.`
    );
  }
}
