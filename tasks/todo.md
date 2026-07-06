# Task List: Single-Hotel Guest Experience

## Task 1: Add room-first navigation guard tests

**Description:** Add focused Vitest source tests that encode the new public routing contract before implementation. The tests should protect `/rooms` as the catalog and prevent normal guest-facing navigation components from routing to `/hotels/[hotelId]`.

**Acceptance criteria:**
- [x] Tests assert `app/(guest)/rooms/page.tsx` uses `getAllRoomTypes()` and not `getPublicHotelCards()`.
- [x] Tests assert `components/homepage/featured-cards.tsx`, `components/search/ResultCard.tsx`, and `components/guest-account/favorites-list.tsx` do not contain public `/hotels/${...}` guest links.
- [x] Tests avoid scanning admin files or the legacy hotel detail route because those are intentionally out of scope.

**Verification:**
- [x] Tests run: `npm test -- tests/unit/rooms-page-catalog.test.ts`
- [x] Manual check: confirm failures point to current hotel-first guest links before implementation changes.

**Dependencies:** None

**Files likely touched:**
- `tests/unit/rooms-page-catalog.test.ts`

**Estimated scope:** Small: 1 file

## Task 2: Convert homepage featured cards to room-first links

**Description:** Stop homepage featured cards from sending guests to hotel detail pages. Extend the featured payload with a representative room route when possible, then link cards to `/rooms/[roomTypeId]` or `/rooms` as a safe fallback.

**Acceptance criteria:**
- [x] `components/homepage/featured-cards.tsx` no longer links cards to `/hotels/[hotelId]`.
- [x] Featured cards use a room detail link when the featured hotel has at least one room type.
- [x] Featured cards fall back to `/rooms` when no representative room type is available.

**Verification:**
- [x] Tests run: `npm test -- tests/unit/rooms-page-catalog.test.ts`
- [x] Manual check: homepage source no longer contains a public featured-card `href` to `/hotels/`.

**Dependencies:** Task 1

**Files likely touched:**
- `lib/featured.ts`
- `components/homepage/featured-cards.tsx`
- `tests/unit/rooms-page-catalog.test.ts`

**Estimated scope:** Medium: 3 files

## Task 3: Route search results through room detail

**Description:** Change search result booking actions to open the selected room detail page instead of the hotel detail page. Preserve `checkIn`, `checkOut`, and `guests` through the room detail URL, then include those values when the room detail booking CTA sends the guest to checkout.

**Acceptance criteria:**
- [x] `components/search/ResultCard.tsx` routes to `/rooms/[roomTypeId]` instead of `/hotels/[hotelId]`.
- [x] Search params `checkIn`, `checkOut`, and `guests` are preserved from search result to room detail.
- [x] `app/(guest)/rooms/[roomTypeId]/page.tsx` includes `roomTypeId`, `hotelId`, and any provided stay params when routing to `/booking/checkout`.

**Verification:**
- [x] Tests run: `npm test -- tests/unit/rooms-page-catalog.test.ts`
- [x] Manual check: inspect generated URLs for search result and room detail checkout actions.

**Dependencies:** Task 1

**Files likely touched:**
- `components/search/ResultCard.tsx`
- `app/(guest)/rooms/[roomTypeId]/page.tsx`
- `tests/unit/rooms-page-catalog.test.ts`

**Estimated scope:** Medium: 3 files

## Task 4: Remove hotel-detail links from guest favorites

**Description:** Keep the current hotel-level favorites data model, but stop the guest account UI from using hotel detail pages as the destination. Since this slice does not change the favorites schema, favorites should link to the room catalog until room-level favorites are designed separately.

**Acceptance criteria:**
- [x] Favorite card image links no longer point to `/hotels/[hotelId]`.
- [x] Favorite card title links no longer point to `/hotels/[hotelId]`.
- [x] Favorite removal behavior remains unchanged.

**Verification:**
- [x] Tests run: `npm test -- tests/unit/rooms-page-catalog.test.ts`
- [x] Manual check: `components/guest-account/favorites-list.tsx` has no public `/hotels/` links.

**Dependencies:** Task 1

**Files likely touched:**
- `components/guest-account/favorites-list.tsx`
- `tests/unit/rooms-page-catalog.test.ts`

**Estimated scope:** Small: 2 files

## Task 5: Update E2E tests for room-first flows

**Description:** Replace hotel-detail E2E assumptions with room-detail assumptions. Homepage tests should look for room links rather than hotel links, and the property detail test should become a room detail flow that verifies room gallery/content/policies and the booking entry path.

**Acceptance criteria:**
- [x] Homepage E2E no longer expects `a[href*='/hotels/']` cards.
- [x] Detail-flow E2E discovers or opens a `/rooms/[roomTypeId]` URL.
- [x] Detail-flow E2E verifies room detail content and can reach checkout or login from the room booking CTA.

**Verification:**
- [x] E2E target runs: `npm run test:e2e -- tests/e2e/homepage.spec.ts tests/e2e/property-detail.spec.ts`
- [x] Manual check: test names describe room-first behavior, not property/hotel detail behavior.

**Dependencies:** Tasks 2, 3, and 4

**Files likely touched:**
- `tests/e2e/homepage.spec.ts`
- `tests/e2e/property-detail.spec.ts`
- `app/(guest)/rooms/[roomTypeId]/page.tsx`

**Estimated scope:** Medium: 3 files

## Task 6: Final verification

**Description:** Run the final project checks and search for remaining guest-facing public hotel-detail navigation. Document any unrelated existing failures without masking them.

**Acceptance criteria:**
- [x] Success criteria from `tasks/spec-single-hotel.md` are satisfied.
- [x] No normal guest-facing public navigation still routes to `/hotels/[hotelId]`.
- [x] Build and test outcomes are recorded.

**Verification:**
- [x] Unit/integration tests run: `npm test`
- [x] Build runs: `npm run build`
- [x] Code search: search for `/hotels/` and confirm remaining matches are legacy route, API internals, or admin-only links.

**Dependencies:** Tasks 1-5

**Files likely touched:**
- No planned code files; verification only

**Estimated scope:** Small: verification only

## Checkpoints

### After Task 1
- [x] Routing guard tests exist and describe the desired public contract.
- [x] No production code has been changed yet.

### After Tasks 2-4
- [x] Homepage, search, and favorites guest navigation no longer send users to hotel detail pages.
- [x] Room detail can forward required checkout params.
- [x] Source-level routing tests pass.

### After Tasks 5-6
- [x] E2E expectations match the single-hotel room-first flow.
- [x] `npm test` and `npm run build` pass or unrelated blockers are documented.
- [x] The implementation is ready for review.
