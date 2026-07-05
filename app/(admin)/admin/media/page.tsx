"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/app/providers";
import { EmptyState } from "@/components/ui/EmptyState";
import { MediaManager } from "@/components/admin/manage/media-manager";

type RoomTypeOption = { id: string; nameAr: string; nameEn: string };

function MediaContent() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const hotelId = searchParams.get("hotelId") ?? "";

  const [ownerType, setOwnerType] = useState<"HOTEL" | "ROOM_TYPE">("HOTEL");
  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([]);
  const [roomTypeId, setRoomTypeId] = useState("");

  // Load the hotel's room types so media can also target a specific room type.
  useEffect(() => {
    if (!hotelId) {
      setRoomTypes([]);
      setRoomTypeId("");
      return;
    }
    fetch(`/api/admin/manage/room-types?hotelId=${encodeURIComponent(hotelId)}`)
      .then((res) => res.json())
      .then((data) => setRoomTypes((data.roomTypes as RoomTypeOption[]) ?? []))
      .catch(() => setRoomTypes([]));
  }, [hotelId]);

  // Reset the room-type target whenever the owner type or hotel changes.
  useEffect(() => {
    setRoomTypeId("");
  }, [ownerType, hotelId]);

  const ownerId = ownerType === "HOTEL" ? hotelId : roomTypeId;

  return (
    <main>
      <h1 className="display-sm mb-8 font-display text-primary">{t.dashboard.mediaManager}</h1>

      {hotelId ? (
        <>
          <div className="mb-6 flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1">
              <span className="field-label">{t.dashboard.mediaManager}</span>
              <select
                value={ownerType}
                onChange={(e) => setOwnerType(e.target.value as "HOTEL" | "ROOM_TYPE")}
                className="field"
              >
                <option value="HOTEL">{t.admin.hotels}</option>
                <option value="ROOM_TYPE">{t.dashboard.roomTypes}</option>
              </select>
            </label>

            {ownerType === "ROOM_TYPE" && (
              <label className="flex flex-col gap-1">
                <span className="field-label">{t.dashboard.roomTypes}</span>
                <select
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(e.target.value)}
                  className="field"
                >
                  <option value="">—</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {locale === "ar" ? rt.nameAr : rt.nameEn}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {ownerId ? (
            <MediaManager key={`${ownerType}:${ownerId}`} ownerType={ownerType} ownerId={ownerId} />
          ) : (
            <EmptyState message={t.dashboard.noRooms} />
          )}
        </>
      ) : (
        <EmptyState message={t.dashboard.selectProperty} />
      )}
    </main>
  );
}

export default function AdminMediaPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-on-surface-muted">...</div>}>
      <MediaContent />
    </Suspense>
  );
}
