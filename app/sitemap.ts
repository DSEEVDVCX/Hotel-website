import type { MetadataRoute } from "next";

const SITE_URL = "https://sewar.sa";

// Single-page site with in-page anchors. We expose the canonical root;
// anchors are not separate documents, so they are not listed as URLs.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      alternates: {
        languages: {
          ar: SITE_URL,
          en: SITE_URL,
        },
      },
    },
  ];
}
