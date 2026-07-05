const MAPS_SCRIPT_ID = "google-maps-script";
let mapsLoaderPromise: Promise<typeof google> | null = null;

export function getMapsApiKey(): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set");
  }
  return key;
}

export function getMapsParams(locale: "ar" | "en"): {
  language: string;
  region: string;
} {
  return {
    language: locale,
    region: "SA",
  };
}

export function buildMapsSrc(locale: "ar" | "en"): string {
  const key = getMapsApiKey();
  const { language, region } = getMapsParams(locale);
  const libs = ["places", "geometry"].join(",");
  return `https://maps.googleapis.com/maps/api/js?key=${key}&language=${language}&region=${region}&libraries=${libs}&callback=__initGoogleMaps`;
}

export function loadGoogleMaps(locale: "ar" | "en"): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }

  if (typeof google !== "undefined" && google.maps) {
    return Promise.resolve(google);
  }

  if (mapsLoaderPromise) {
    return mapsLoaderPromise;
  }

  mapsLoaderPromise = new Promise<typeof google>((resolve, reject) => {
    const existing = document.getElementById(MAPS_SCRIPT_ID);
    if (existing) {
      (window as unknown as Record<string, unknown>).__initGoogleMaps = () => {
        resolve(google);
      };
      return;
    }

    (window as unknown as Record<string, unknown>).__initGoogleMaps = () => {
      resolve(google);
    };

    const script = document.createElement("script");
    script.id = MAPS_SCRIPT_ID;
    script.src = buildMapsSrc(locale);
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      mapsLoaderPromise = null;
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });

  return mapsLoaderPromise;
}

export function isMapsApiKeyConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
}
