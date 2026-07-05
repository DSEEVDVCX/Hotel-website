import { describe, it, expect } from "vitest";
import { getMapsParams, buildMapsSrc, isMapsApiKeyConfigured } from "@/lib/google-maps";

describe("Google Maps locale config", () => {
  it("returns ar language + SA region for Arabic locale", () => {
    const params = getMapsParams("ar");
    expect(params.language).toBe("ar");
    expect(params.region).toBe("SA");
  });

  it("returns en language + SA region for English locale", () => {
    const params = getMapsParams("en");
    expect(params.language).toBe("en");
    expect(params.region).toBe("SA");
  });

  it("builds a maps src URL with the correct locale params", () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";
    const src = buildMapsSrc("ar");
    expect(src).toContain("language=ar");
    expect(src).toContain("region=SA");
    expect(src).toContain("key=test-key");
    expect(src).toContain("libraries=places,geometry");
  });

  it("detects when the API key is configured", () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-key";
    expect(isMapsApiKeyConfigured()).toBe(true);

    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    expect(isMapsApiKeyConfigured()).toBe(false);
  });
});
