import type { Metadata } from "next";
import { getAllRoomTypes } from "@/lib/room-types";
import RoomsGrid from "@/components/homepage/rooms-grid";
import SiteFooter from "@/components/homepage/site-footer";

export const metadata: Metadata = {
  title: "الغرف والأجنحة | Rooms & Suites — سوار الأندلس",
  description:
    "تصفّح جميع الغرف والأجنحة الفاخرة المتاحة في سوار الأندلس واختر إقامتك المثالية. Browse every luxury room and suite available at Sewar AlAndalus.",
};

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const rooms = await getAllRoomTypes();

  return (
    <>
      <main id="main" className="overflow-x-hidden w-full max-w-full pt-20">
        <RoomsGrid rooms={rooms} showFilters />
      </main>
      <SiteFooter />
    </>
  );
}
