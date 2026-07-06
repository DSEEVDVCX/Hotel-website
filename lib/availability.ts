import { prisma } from "@/lib/db";

const blockingBookingStatuses = ["PENDING", "CONFIRMED", "CHECKED_IN"] as const;

export interface AvailableRoomType {
  hotelId: string;
  hotelNameAr: string;
  hotelNameEn: string;
  starRating: number;
  roomTypeId: string;
  roomTypeNameAr: string;
  roomTypeNameEn: string;
  availableRooms: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  photos: string[];
  capacity: number;
}

export async function searchAvailableRooms(params: {
  city: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  page: number;
  limit: number;
}): Promise<{ results: AvailableRoomType[]; total: number }> {
  const { city, checkIn, checkOut, guests, page, limit } = params;

  const hotels = await prisma.hotel.findMany({
    where: {
      OR: [
        { city: { contains: city } },
        { nameAr: { contains: city } },
        { nameEn: { contains: city, mode: "insensitive" } },
      ],
      status: "ACTIVE",
    },
    include: {
      roomTypes: {
        where: { capacity: { gte: guests } },
        include: {
          rooms: {
            where: {
              status: "AVAILABLE",
              reservations: {
                none: {
                  AND: [
                    { checkIn: { lt: checkOut } },
                    { checkOut: { gt: checkIn } },
                    { bookingLineItem: { booking: { status: { in: [...blockingBookingStatuses] } } } },
                  ],
                },
              },
            },
          },
          rates: {
            where: {
              startDate: { lte: checkOut },
              endDate: { gte: checkIn },
            },
          },
        },
      },
    },
  });

  const results: AvailableRoomType[] = [];
  for (const hotel of hotels) {
    for (const roomType of hotel.roomTypes) {
      const availableRooms = roomType.rooms.length;
      if (availableRooms === 0) continue;

      const pricePerNight = getEffectiveNightlyRate(roomType, checkIn);
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalPrice = pricePerNight * nights;

      results.push({
        hotelId: hotel.id,
        hotelNameAr: hotel.nameAr,
        hotelNameEn: hotel.nameEn,
        starRating: hotel.starRating,
        roomTypeId: roomType.id,
        roomTypeNameAr: roomType.nameAr,
        roomTypeNameEn: roomType.nameEn,
        availableRooms,
        pricePerNight,
        totalPrice,
        currency: "SAR",
        photos: roomType.photos,
        capacity: roomType.capacity,
      });
    }
  }

  const total = results.length;
  const start = (page - 1) * limit;
  const paginated = results.slice(start, start + limit);

  return { results: paginated, total };
}

export function getEffectiveNightlyRate(
  roomType: { basePrice: { toNumber: () => number }; rates: Array<{ nightlyPrice: { toNumber: () => number }; startDate: Date; endDate: Date }> },
  date: Date
): number {
  const basePrice = roomType.basePrice.toNumber();

  const rates = [...roomType.rates].sort(
    (a, b) => b.startDate.getTime() - a.startDate.getTime()
  );

  for (const rate of rates) {
    if (date >= rate.startDate && date <= rate.endDate) {
      return rate.nightlyPrice.toNumber();
    }
  }

  return basePrice;
}

export async function getHotelWithAvailability(hotelId: string, checkIn: Date, checkOut: Date) {
  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, status: "ACTIVE" },
    include: {
      roomTypes: {
        include: {
          rooms: {
            where: {
              status: "AVAILABLE",
              reservations: {
                none: {
                  AND: [
                    { checkIn: { lt: checkOut } },
                    { checkOut: { gt: checkIn } },
                    { bookingLineItem: { booking: { status: { in: [...blockingBookingStatuses] } } } },
                  ],
                },
              },
            },
          },
          rates: {
            where: {
              startDate: { lte: checkOut },
              endDate: { gte: checkIn },
            },
          },
        },
      },
    },
  });

  return hotel;
}
