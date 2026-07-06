# Implementation Plan: Single-Hotel Guest Experience

## Overview
Implement `tasks/spec-single-hotel.md` by converting the public guest journey from hotel-first navigation to room-first navigation. The database and booking model will remain unchanged for this slice: `Hotel`, `RoomType`, and `Booking.hotelId` stay in place because checkout and admin flows depend on them. The visible guest experience will route homepage, featured cards, search results, favorites, and catalog browsing toward `/rooms` and `/rooms/[roomTypeId]` instead of `/hotels/[hotelId]`.

## Architecture Decisions
- Keep the Prisma schema unchanged. The backend still needs `hotelId` for bookings, room ownership, reviews, and admin workflows.
- Keep `/hotels/[hotelId]` as a legacy direct route for now. Public navigation should stop linking to it, but redirecting or deleting the route requires separate approval because it changes persisted URLs.
- Make room detail pages the primary public detail surface. Search params such as `checkIn`, `checkOut`, and `guests` should flow from search results to room detail and then into checkout.
- Reuse existing room APIs instead of adding a new single-hotel API. `GET /api/room-types/[id]` already returns room data plus the hotel context required for policies and checkout.
- Prefer source-level Vitest guards for routing contracts and targeted Playwright updates for user-flow expectations.

## Dependency Graph
1. Existing data model remains the foundation: `Hotel` -> `RoomType` -> `Room` -> `Booking`.
2. Existing API contracts remain stable: `/api/room-types/[id]`, `/api/search`, `/api/bookings`, `/api/payments/intents`.
3. Guest navigation changes consume those existing contracts: homepage featured cards, search results, favorites, and room detail booking CTA.
4. Tests encode the new public contract: guest-facing links should prefer `/rooms` and `/rooms/[roomTypeId]`, not `/hotels/[hotelId]`.

## Task List

### Phase 1: Routing Guardrails
- [ ] Task 1: Add source-level tests for room-first public navigation.

### Checkpoint: Guardrails
- [ ] `npm test -- tests/unit/rooms-page-catalog.test.ts` fails on current hotel-first links or passes only for already-correct room catalog behavior.
- [ ] The intended public routing contract is explicit before UI changes begin.

### Phase 2: Guest Navigation Slices
- [ ] Task 2: Convert homepage featured cards away from hotel-detail links.
- [ ] Task 3: Route search results through room detail and preserve stay params.
- [ ] Task 4: Remove hotel-detail links from guest favorites.

### Checkpoint: Core Guest Flow
- [ ] Homepage public card links no longer include `/hotels/`.
- [ ] Search result primary action opens `/rooms/[roomTypeId]` with stay params.
- [ ] Room detail checkout CTA preserves required checkout params.
- [ ] Source-level routing tests pass.

### Phase 3: Flow Tests and Verification
- [ ] Task 5: Update E2E tests from property-detail-first to room-detail-first expectations.
- [ ] Task 6: Run final verification and document any existing blockers.

### Checkpoint: Complete
- [ ] All success criteria in `tasks/spec-single-hotel.md` are met.
- [ ] `npm test` passes or unrelated existing failures are documented.
- [ ] `npm run build` passes or unrelated existing failures are documented.
- [ ] Code search confirms no normal guest-facing public navigation still routes to `/hotels/[hotelId]`.
- [ ] Ready for implementation review.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Featured data is hotel-shaped, not room-shaped. | Medium | Add a representative room route to the featured payload or fall back to `/rooms` when no room type is available. |
| Checkout requires `hotelId` even though public navigation becomes room-first. | High | Keep `hotelId` in room detail API data and build checkout params from the loaded room record. |
| Search-to-room flow could lose selected dates and guests. | Medium | Pass `checkIn`, `checkOut`, and `guests` through URL params and include them in the room detail checkout CTA. |
| Existing E2E tests expect hotel detail pages. | Medium | Update tests to discover `/rooms/` links and assert room detail behavior instead of property detail room lists. |
| Direct `/hotels/[hotelId]` remains accessible. | Low | Treat it as a legacy direct route for this slice; redirecting it is a separate approved task. |

## Parallelization Opportunities
- Task 2 and Task 4 can be implemented independently after Task 1.
- Task 3 should be sequential because search result routing and room detail checkout params form one connected flow.
- Task 5 should happen after Tasks 2-4 because E2E expectations depend on the final public links.
- Task 6 must run last.

## Open Questions
- None blocking for this plan. The plan keeps `/hotels/[hotelId]` as a legacy direct URL and removes it from normal guest navigation. Redirecting or deleting that route remains out of scope unless explicitly approved.
