import { getAllRoomTypes } from "@/lib/room-types";
import { getFeaturedProperties } from "@/lib/featured";
import Navbar from "@/components/Navbar";
import nextDynamic from "next/dynamic";
import RoomsGrid from "@/components/homepage/rooms-grid";
import FeaturedCards from "@/components/homepage/featured-cards";
import SiteFooter from "@/components/homepage/site-footer";

const HotelHero = nextDynamic(() => import("@/components/homepage/hero"), { ssr: true, loading: () => <div className="min-h-[100dvh] bg-surface-dark" /> });
const Marquee = nextDynamic(() => import("@/components/homepage/marquee"), { ssr: true });
const ContentSections = nextDynamic(() => import("@/components/homepage/content-sections"), { ssr: true, loading: () => <div className="h-96" /> });

export const dynamic = "force-dynamic";

export default async function Home() {
  const [rooms, featured] = await Promise.all([
    getAllRoomTypes(),
    getFeaturedProperties(6),
  ]);

  return (
    <>
      <Navbar heroDark />
      <main id="main" className="overflow-x-hidden w-full max-w-full">
        <HotelHero />
        <Marquee />
        <RoomsGrid rooms={rooms.slice(0, 3)} viewAllHref="/rooms" />
        {featured.length > 0 && <FeaturedCards properties={featured} />}
        <ContentSections />
      </main>
      <SiteFooter />
    </>
  );
}
