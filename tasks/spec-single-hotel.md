# Spec: Single-Hotel Guest Experience

## Assumptions
1. This is a Next.js web application change for the public guest-facing site.
2. The site should present Sewar AlAndalus as one hotel, not as a marketplace or multi-hotel directory.
3. The existing Prisma schema can keep `Hotel`, `RoomType`, `Room`, and `Booking.hotelId` for now because bookings, rooms, reviews, favorites, and admin ownership already depend on that relationship.
4. This implementation should hide or bypass public hotel-detail navigation first, not delete database models or admin workflows.
5. Room and suite pages should be the primary public detail pages. A guest opening a room should see the room detail, hotel policies/location context, gallery, and booking action without being routed through a hotel page that lists rooms underneath.
6. Search and homepage cards should lead to room pages or booking checkout, not `/hotels/[hotelId]` pages.
7. Arabic and English UI, RTL/LTR behavior, current visual style, and existing booking checkout should be preserved.

## Objective
Convert the public guest experience from a multi-hotel browsing model into a single-hotel site focused on the hotel's rooms and suites.

Primary user stories:
- As a guest, when I browse the homepage, featured sections, search results, or `/rooms`, I navigate to rooms/suites instead of hotel detail pages.
- As a guest, when I open a room page, I do not see a hotel page with the hotel's room list underneath. I see a self-contained room detail page for the one hotel.
- As the site owner, I can keep using the current admin/database structure while the public site behaves like a one-hotel website.
- As a developer, future work can remove or redirect public hotel routes only after the guest flows no longer depend on them.

## Tech Stack
- Next.js `^15.5.20`
- React `19.0.0`
- TypeScript `^5.7.3`
- Prisma `^7.8.0`
- PostgreSQL via `@prisma/adapter-pg` `^7.8.0`
- Firebase Admin `^14.1.0`
- Tailwind CSS `^4.0.0`
- Vitest `^4.1.9`
- Playwright `^1.61.1`

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Unit/integration tests: `npm test`
- E2E tests: `npm run test:e2e`
- Prisma generate: `npm run db:generate`
- Prisma push: `npm run db:push`

Note: `package.json` defines `lint` as `next lint`; this may be incompatible with the current Next.js setup. Use build and tests as the primary verification path unless lint is restored.

## Project Structure
- `app/page.tsx` -> homepage, currently loads rooms and featured hotel cards.
- `app/(guest)/rooms/page.tsx` -> public rooms and suites catalog.
- `app/(guest)/rooms/[roomTypeId]/page.tsx` -> public room detail page and booking entry point.
- `app/(guest)/hotels/[hotelId]/page.tsx` -> current public hotel detail page that should no longer be a primary guest destination.
- `app/api/room-types/[id]/route.ts` -> room detail API used by room pages and checkout.
- `app/api/hotels/[hotelId]/route.ts` -> hotel detail API used by the hotel detail page.
- `components/homepage/rooms-grid.tsx` -> room card grid used by homepage and `/rooms`.
- `components/homepage/featured-cards.tsx` -> currently links featured cards to hotel pages.
- `components/search/ResultCard.tsx` -> currently sends search booking action to hotel detail pages.
- `components/guest-account/favorites-list.tsx` -> currently links saved hotel favorites to hotel pages.
- `app/(guest)/booking/checkout/page.tsx` -> checkout page, currently requires `hotelId` and `roomTypeId`.
- `lib/room-types.ts` -> room catalog/detail fetching and normalization.
- `lib/featured.ts` -> featured hotel card fetching.
- `lib/availability.ts` -> search and hotel availability logic.
- `tests/unit/` -> Vitest source/behavior guard tests.
- `tests/e2e/` -> Playwright guest-flow tests.
- `tasks/` -> specs, plans, and task lists for gated work.

## Code Style
Follow the existing TypeScript and React style: keep data access in `lib/`, route handlers in `app/api/`, page-level orchestration in `app/`, and reusable guest UI in `components/`. Prefer small routing changes over schema changes where the existing model already supports the desired behavior.

```tsx
const params = new URLSearchParams({
  checkIn,
  checkOut,
  guests,
});

router.push(`/rooms/${room.roomTypeId}?${params.toString()}`);
```

Conventions:
- Public guest links should prefer `/rooms/[roomTypeId]` for inventory details.
- Keep `hotelId` in API payloads and checkout params when the backend still needs it.
- Preserve Arabic/English labels and existing RTL/LTR behavior.
- Avoid adding compatibility layers unless a persisted URL or active user flow requires it.
- Do not add dependencies for routing-only changes.

## Testing Strategy
- Add or update focused Vitest source tests to guard that homepage/search/room flows do not link public guest cards to `/hotels/[hotelId]`.
- Update Playwright E2E expectations that currently discover and test hotel detail pages from homepage cards.
- Use `npm run build` to verify TypeScript and Next.js route compilation.
- Use `npm test` for unit/integration guards.
- Use targeted Playwright tests when feasible for homepage, room catalog, room detail, search result navigation, and checkout entry.

Manual verification targets:
- Homepage room and featured sections do not route guests to `/hotels/[hotelId]`.
- `/rooms` lists room/suite cards and every card opens `/rooms/[roomTypeId]`.
- Search result primary action opens the relevant room detail or checkout flow, not a hotel detail page.
- Room detail page shows room content, gallery, policy context, and booking CTA without a hotel page wrapper or room list below it.
- Booking still receives the required `hotelId` and `roomTypeId` before checkout submission.

## Boundaries
- Always: keep public guest navigation room-first, preserve booking compatibility with `hotelId`, run build/tests before finalizing, and maintain Arabic/English behavior.
- Ask first: changing Prisma schema, deleting the hotel detail route, deleting hotel APIs, changing checkout data requirements, adding dependencies, changing admin workflows, or changing CI/test infrastructure.
- Never: commit secrets, edit generated `.next` or vendor files, remove failing tests only to pass verification, break existing booking creation, or remove persisted data paths without approval.

## Success Criteria
- Public homepage cards and search result actions no longer route users to `/hotels/[hotelId]` for normal guest browsing.
- `/rooms` remains the main inventory catalog and uses room-type data from `getAllRoomTypes()`.
- `/rooms/[roomTypeId]` is the main detail page for a room/suite and includes enough hotel context for policies, location/address, and booking.
- Opening a room no longer presents a hotel detail page followed by a list of rooms.
- Checkout continues to work with both `roomTypeId` and the underlying `hotelId` required by the booking model.
- Tests are updated so the expected public flow is room-first rather than hotel-detail-first.
- `npm run build` and `npm test` pass, or any unrelated existing blocker is documented.

## Open Questions
- Should `/hotels/[hotelId]` remain accessible by direct URL for now, or should it redirect to `/rooms` after public navigation stops using it?
- Should featured homepage content become featured rooms/suites instead of featured hotels, or should the existing featured hotel data be converted into links to a representative room?
- Should guest favorites continue to favorite the hotel, or should favorites move to room types in a later database/API change?
- Should search result primary action open room detail first or go directly to checkout with selected dates and guests?
