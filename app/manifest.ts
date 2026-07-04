import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Suwar Al Dhahab · سوار الذهب",
    short_name: "Suwar",
    description: "A luxury gold-market destination gathering elite gold boutiques under one roof.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f2ea",
    theme_color: "#f6f2ea",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/images/logo.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
