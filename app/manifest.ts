import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "IFTA Consulting Client Portal",
    short_name: "IFTA",
    description:
      "Secure consulting services, client engagements, documents, messages and administration.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#BDD9D7",
    theme_color: "#03363D",
    orientation: "any",
    lang: "en-KE",
    categories: ["business", "productivity", "finance"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Sign in",
        short_name: "Sign in",
        description: "Open your secure IFTA workspace.",
        url: "/sign-in",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Services",
        short_name: "Services",
        description: "Browse IFTA consulting services.",
        url: "/services",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Contact IFTA",
        short_name: "Contact",
        description: "Send IFTA Consulting an enquiry.",
        url: "/contact",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
