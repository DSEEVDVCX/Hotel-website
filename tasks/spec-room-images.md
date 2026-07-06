# Spec: Supplied Images and Rooms Catalog

## Assumptions
1. This is a Next.js web application change for the public hotel, room, and homepage catalog UI.
2. Public hotel and room imagery must come only from admin/owner supplied data: `photos` arrays or `MediaAsset` records.
3. If no supplied image exists, the UI should show a neutral empty/image-missing state or omit the image area instead of using generated or placeholder photo URLs.
4. The `/rooms` page must display room and suite cards from `getAllRoomTypes()`, not hotel/property cards.
5. This change does not add local file uploads; existing URL-based photo entry and media management remain the source of images.

## Objective
Ensure Sewar AlAndalus never presents fake hotel or room photos as real inventory. The guest-facing experience should only display images supplied through existing admin/owner content fields, and the rooms and suites page should show actual room types rather than hotels.

Primary user stories:
- As a site owner, I can add real room and hotel images through the existing admin photo fields/media tools and trust the public site to show only those images.
- As a guest, when I open `/rooms`, I see rooms and suites, not hotel cards.
- As a guest, when a hotel or room has no supplied images, I do not see random placeholder photos that could misrepresent the property.

## Tech Stack
- Next.js `^15.5.20`
- React `19.0.0`
- TypeScript `^5.7.3`
- Prisma `^7.8.0`
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

Note: `package.json` has `lint: next lint`, but Next.js 15 may not support `next lint` in this setup. Use build/tests as the primary verification path unless lint is restored.

## Project Structure
- `app/(guest)/rooms/page.tsx` -> public rooms and suites listing page.
- `app/(guest)/rooms/[roomTypeId]/page.tsx` -> public room detail page.
- `app/(guest)/hotels/[hotelId]/page.tsx` -> public hotel detail page.
- `app/page.tsx` -> homepage, including room and featured hotel sections.
- `components/homepage/rooms-grid.tsx` -> room card grid used by homepage and `/rooms`.
- `components/homepage/featured-cards.tsx` -> featured hotel cards on homepage.
- `components/property-detail/photo-gallery.tsx` -> gallery empty state and image layout.
- `components/property-detail/available-rooms.tsx` -> room cards inside hotel detail.
- `lib/room-types.ts` -> room catalog/detail fetching and normalization.
- `lib/featured.ts` -> featured hotel card fetching.
- `components/search/ResultCard.tsx` -> room result cards on search pages.
- `app/(guest)/booking/checkout/page.tsx` -> booking summary for selected room.
- `tests/` -> Vitest unit/integration tests and Playwright E2E tests.

## Code Style
Use the existing TypeScript and React style: named helpers for data normalization, server functions in `lib/`, client UI in `components/`, and concise fallback logic that prefers real content over generated data.

```tsx
const galleryImages = hotel.gallery?.length
  ? hotel.gallery.map((media) => ({
      url: media.url,
      captionAr: media.captionAr,
      captionEn: media.captionEn,
      sortOrder: media.sortOrder,
    }))
  : hotel.photos.map((url, index) => ({
      url,
      captionAr: name,
      captionEn: name,
      sortOrder: index,
    }));

<PhotoGallery images={galleryImages} />
```

Conventions:
- Keep image selection explicit: `MediaAsset` first where available, then supplied `photos`, then empty state.
- Do not introduce remote placeholder services such as `picsum.photos`.
- Keep `/rooms` data typed as room types and avoid passing hotel-shaped cards to `RoomsGrid`.
- Preserve Arabic/English labels and existing RTL/LTR behavior.

## Testing Strategy
- Use `npm run build` to catch TypeScript and Next.js rendering errors.
- Use focused Vitest tests where existing data normalization helpers can be tested without a browser.
- Use Playwright only for final guest-flow verification if the app builds and test fixtures support the scenario.
- Manual verification targets:
  - `/rooms` renders room names and links to `/rooms/[roomTypeId]`.
  - No public guest UI references `picsum.photos` for hotels or rooms.
  - Missing images show a neutral empty state or no image region, not a fake photo.

## Boundaries
- Always: preserve existing admin photo entry paths, run build/tests before finalizing, keep `/rooms` as a room catalog, and avoid fake/public placeholder photo URLs.
- Ask first: adding file upload/storage, changing Prisma schema, adding dependencies, changing CI, or removing existing admin media workflows.
- Never: commit secrets, edit generated/vendor directories, remove failing tests to make verification pass, or replace user/admin images with generated photos.

## Success Criteria
- `components/homepage/rooms-grid.tsx` no longer falls back to `picsum.photos`; cards without supplied room photos render an acceptable non-photo state.
- `lib/room-types.ts` no longer generates fake room gallery records for room detail pages.
- `app/(guest)/rooms/[roomTypeId]/page.tsx` no longer uses a fake hero image when room photos/gallery are missing.
- `app/(guest)/hotels/[hotelId]/page.tsx` no longer uses fake hotel hero or gallery images; gallery falls back to empty state when needed.
- `components/property-detail/available-rooms.tsx` no longer uses fake room card images inside hotel detail pages.
- Search result cards and booking summary room thumbnails no longer use fake room images.
- `components/homepage/featured-cards.tsx` no longer uses fake hotel card images.
- `/rooms` continues to call `getAllRoomTypes()` and display room/suite cards, not hotel cards.
- Verification finds no remaining public guest-facing `picsum.photos` references for hotel or room imagery.

## Open Questions
- None for this implementation slice. Adding direct file uploads is intentionally out of scope.
