import { prisma } from "@/lib/db";

async function migratePhotosToMediaAssets() {
  console.log("Starting photos → MediaAsset migration...");

  const hotels = await prisma.hotel.findMany({
    select: { id: true, photos: true, ownerId: true },
  });

  let created = 0;
  for (const hotel of hotels) {
    if (!hotel.photos || hotel.photos.length === 0) continue;

    for (let i = 0; i < hotel.photos.length; i++) {
      const url = hotel.photos[i];
      const existing = await prisma.mediaAsset.findFirst({
        where: { ownerType: "HOTEL", ownerId: hotel.id, url },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.mediaAsset.create({
        data: {
          ownerType: "HOTEL",
          ownerId: hotel.id,
          url,
          sortOrder: i,
          uploadedBy: hotel.ownerId,
        },
      });
      created++;
    }
    console.log(`  Hotel ${hotel.id}: ${hotel.photos.length} photos migrated`);
  }

  const roomTypes = await prisma.roomType.findMany({
    select: { id: true, photos: true, hotel: { select: { ownerId: true } } },
  });

  for (const rt of roomTypes) {
    if (!rt.photos || rt.photos.length === 0) continue;

    for (let i = 0; i < rt.photos.length; i++) {
      const url = rt.photos[i];
      const existing = await prisma.mediaAsset.findFirst({
        where: { ownerType: "ROOM_TYPE", ownerId: rt.id, url },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.mediaAsset.create({
        data: {
          ownerType: "ROOM_TYPE",
          ownerId: rt.id,
          url,
          sortOrder: i,
          uploadedBy: rt.hotel.ownerId,
        },
      });
      created++;
    }
    console.log(`  RoomType ${rt.id}: ${rt.photos.length} photos migrated`);
  }

  console.log(`Migration complete. ${created} MediaAsset rows created.`);
}

migratePhotosToMediaAssets()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
