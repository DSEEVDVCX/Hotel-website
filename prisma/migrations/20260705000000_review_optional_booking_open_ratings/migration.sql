-- Phase 1 "open ratings" change, recorded as a migration to keep history in
-- sync with the database (the SQL below was already applied manually).
--
-- NOTE: Do NOT run `prisma migrate dev` to auto-resolve schema diffs on this
-- project. RoomReservation.stayRange is a DB-only `daterange` column backing the
-- RoomReservation_no_overlap GiST exclusion constraint (see the init migration);
-- `migrate dev` will offer to DROP it, which would remove double-booking safety.
-- Evolve the schema with hand-written migrations + `prisma migrate deploy`.

-- Review may now exist without a booking (any logged-in user can rate a hotel).
ALTER TABLE "Review" ALTER COLUMN "bookingId" DROP NOT NULL;

-- One review per guest per hotel.
CREATE UNIQUE INDEX IF NOT EXISTS "Review_guestId_hotelId_key" ON "Review"("guestId", "hotelId");
