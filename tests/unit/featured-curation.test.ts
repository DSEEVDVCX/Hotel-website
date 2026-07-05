import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    hotel: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    featuredSelection: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    booking: {
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { POST } from "@/app/api/admin/featured/route";
import { PUT as reorderFeatured } from "@/app/api/admin/featured/reorder/route";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockPrisma = prisma as unknown as {
  hotel: { findUnique: ReturnType<typeof vi.fn> };
  featuredSelection: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

function makeReq(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

describe("Featured Curation (T056)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
  });

  it("adds an ACTIVE hotel to featured", async () => {
    mockPrisma.hotel.findUnique.mockResolvedValue({ id: "h1", status: "ACTIVE" });
    mockPrisma.featuredSelection.create.mockResolvedValue({
      id: "f1",
      hotelId: "h1",
      sortOrder: 0,
      curatedBy: "admin-1",
    });

    const res = await POST(makeReq({ hotelId: "h1", sortOrder: 0 }));

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.hotelId).toBe("h1");
    expect(mockPrisma.featuredSelection.create).toHaveBeenCalledWith({
      data: { hotelId: "h1", sortOrder: 0, curatedBy: "admin-1" },
    });
  });

  it("rejects a PENDING hotel with 422", async () => {
    mockPrisma.hotel.findUnique.mockResolvedValue({ id: "h1", status: "PENDING" });

    const res = await POST(makeReq({ hotelId: "h1", sortOrder: 0 }));

    expect(res.status).toBe(422);
    expect(mockPrisma.featuredSelection.create).not.toHaveBeenCalled();
  });

  it("rejects a SUSPENDED hotel with 422", async () => {
    mockPrisma.hotel.findUnique.mockResolvedValue({ id: "h1", status: "SUSPENDED" });

    const res = await POST(makeReq({ hotelId: "h1", sortOrder: 0 }));

    expect(res.status).toBe(422);
    expect(mockPrisma.featuredSelection.create).not.toHaveBeenCalled();
  });

  it("rejects an unknown hotel with 404", async () => {
    mockPrisma.hotel.findUnique.mockResolvedValue(null);

    const res = await POST(makeReq({ hotelId: "missing", sortOrder: 0 }));

    expect(res.status).toBe(404);
    expect(mockPrisma.featuredSelection.create).not.toHaveBeenCalled();
  });

  it("prevents duplicates via unique constraint (P2002 → 409)", async () => {
    mockPrisma.hotel.findUnique.mockResolvedValue({ id: "h1", status: "ACTIVE" });
    const uniqueError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (`hotelId`)",
      { code: "P2002", clientVersion: "7.8.0" }
    );
    mockPrisma.featuredSelection.create.mockRejectedValue(uniqueError);

    const res = await POST(makeReq({ hotelId: "h1", sortOrder: 0 }));

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/already featured/i);
  });

  it("reorders featured hotels, setting sortOrder by index", async () => {
    mockPrisma.$transaction.mockImplementation(async (ops: unknown[]) => ops);

    const res = await reorderFeatured(
      makeReq({ orderedHotelIds: ["h3", "h1", "h2"] })
    );

    expect(res.status).toBe(200);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    const calls = mockPrisma.featuredSelection.update.mock.calls;
    expect(calls).toHaveLength(3);
    expect(calls[0]).toEqual([
      { where: { hotelId: "h3" }, data: { sortOrder: 0 } },
    ]);
    expect(calls[1]).toEqual([
      { where: { hotelId: "h1" }, data: { sortOrder: 1 } },
    ]);
    expect(calls[2]).toEqual([
      { where: { hotelId: "h2" }, data: { sortOrder: 2 } },
    ]);
  });

  it("rejects an empty reorder payload with 422", async () => {
    const res = await reorderFeatured(makeReq({ orderedHotelIds: [] }));

    expect(res.status).toBe(422);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});
