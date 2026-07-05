import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "../lib/password";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await hashPassword("admin1234");
  const guestPassword = await hashPassword("guest1234");

  const admin = await prisma.user.upsert({
    where: { email: "admin@suweraldhahab.sa" },
    update: {},
    create: {
      email: "admin@suweraldhahab.sa",
      passwordHash: adminPassword,
      name: "Platform Admin",
      role: "ADMIN",
    },
  });

  const guest = await prisma.user.upsert({
    where: { email: "guest@example.com" },
    update: {},
    create: {
      email: "guest@example.com",
      passwordHash: guestPassword,
      name: "أحمد محمد",
      role: "GUEST",
      phoneNumber: "+966555000222",
    },
  });

  const hotel = await prisma.hotel.upsert({
    where: { id: "seed-hotel-1" },
    update: {
      photos: ["/images/hero.jpeg", "/images/dest-1.jpeg", "/images/dest-2.jpeg", "/images/dest-3.jpeg"],
    },
    create: {
      id: "seed-hotel-1",
      ownerId: admin.id,
      nameAr: "فندق الرياض الذهبي",
      nameEn: "Riyadh Golden Hotel",
      descriptionAr: "فندق فاخر في قلب الرياض",
      descriptionEn: "A luxury hotel in the heart of Riyadh",
      city: "الرياض",
      address: "شارع الملك فهد، الرياض",
      starRating: 5,
      amenities: ["wifi", "pool", "spa", "gym"],
      photos: ["/images/hero.jpeg", "/images/dest-1.jpeg", "/images/dest-2.jpeg", "/images/dest-3.jpeg"],
      status: "ACTIVE",
      cancellationPolicyHours: 48,
      checkInTime: "15:00",
      checkOutTime: "12:00",
    },
  });

  const deluxeRoomType = await prisma.roomType.upsert({
    where: { id: "seed-roomtype-deluxe" },
    update: {
      photos: ["/images/dest-4.jpeg"],
    },
    create: {
      id: "seed-roomtype-deluxe",
      hotelId: hotel.id,
      nameAr: "غرفة ديلوكس",
      nameEn: "Deluxe Room",
      descriptionAr: "غرفة واسعة بإطلالة ممتازة",
      descriptionEn: "Spacious room with great view",
      capacity: 2,
      bedType: "king",
      basePrice: 450,
      amenities: ["wifi", "ac", "tv", "minibar"],
      photos: ["/images/dest-4.jpeg"],
    },
  });

  const familyRoomType = await prisma.roomType.upsert({
    where: { id: "seed-roomtype-family" },
    update: {
      photos: ["/images/dest-5.jpeg"],
    },
    create: {
      id: "seed-roomtype-family",
      hotelId: hotel.id,
      nameAr: "غرفة عائلية",
      nameEn: "Family Room",
      descriptionAr: "غرفة واسعة لعائلة",
      descriptionEn: "Spacious family room",
      capacity: 4,
      bedType: "twin",
      basePrice: 650,
      amenities: ["wifi", "ac", "tv", "minibar", "kitchenette"],
      photos: ["/images/dest-5.jpeg"],
    },
  });

  const rooms = [
    { id: "seed-room-101", roomNumber: "101", floor: 1, roomTypeId: deluxeRoomType.id, hotelId: hotel.id },
    { id: "seed-room-102", roomNumber: "102", floor: 1, roomTypeId: deluxeRoomType.id, hotelId: hotel.id },
    { id: "seed-room-103", roomNumber: "103", floor: 1, roomTypeId: deluxeRoomType.id, hotelId: hotel.id },
    { id: "seed-room-201", roomNumber: "201", floor: 2, roomTypeId: familyRoomType.id, hotelId: hotel.id },
    { id: "seed-room-202", roomNumber: "202", floor: 2, roomTypeId: familyRoomType.id, hotelId: hotel.id },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: {},
      create: room,
    });
  }

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const checkIn = new Date(nextMonth);
  checkIn.setDate(5);
  const checkOut = new Date(nextMonth);
  checkOut.setDate(7);

  const existingBooking = await prisma.booking.findFirst({
    where: { idempotencyKey: "seed-booking-001" },
  });

  if (!existingBooking) {
    const booking = await prisma.booking.create({
      data: {
        guestId: guest.id,
        hotelId: hotel.id,
        checkIn,
        checkOut,
        guestCount: 2,
        status: "CONFIRMED",
        totalPrice: 900,
        idempotencyKey: "seed-booking-001",
        lineItems: {
          create: {
            roomTypeId: deluxeRoomType.id,
            quantity: 1,
            unitPricePerNight: 450,
            lineTotal: 900,
            reservations: {
              create: {
                roomId: "seed-room-101",
                checkIn,
                checkOut,
              },
            },
          },
        },
        payment: {
          create: {
            amount: 900,
            currency: "SAR",
            status: "CAPTURED",
            providerPaymentRef: "seed_pay_001",
            capturedAt: new Date(),
          },
        },
      },
    });
    console.log(`Seeded booking: ${booking.id}`);
  }

  console.log("Seed data created successfully");
  console.log(`  Admin: ${admin.email}`);
  console.log(`  Guest: ${guest.email}`);
  console.log(`  Hotel: ${hotel.nameEn} (${hotel.nameAr})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
