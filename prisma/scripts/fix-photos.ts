import { config } from "dotenv";
config();

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.hotel.update({
    where: { id: "seed-hotel-1" },
    data: {
      photos: ["/images/hero.jpeg", "/images/dest-1.jpeg", "/images/dest-2.jpeg", "/images/dest-3.jpeg"],
    },
  });

  await prisma.roomType.update({
    where: { id: "seed-roomtype-deluxe" },
    data: { photos: ["/images/dest-4.jpeg"] },
  });

  await prisma.roomType.update({
    where: { id: "seed-roomtype-family" },
    data: { photos: ["/images/dest-5.jpeg"] },
  });

  console.log("Photo paths updated successfully");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
