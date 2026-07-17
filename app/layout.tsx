import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegistration } from "@/components/pwa/pwa-registration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "IFTA Consulting",
  title: {
    default: "IFTA Consulting Client Portal",
    template: "%s | IFTA Consulting",
  },
  description:
    "Secure consulting client portal and workflow management platform for IFTA Consulting (K) Ltd.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IFTA Consulting",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#03363D" },
    { media: "(prefers-color-scheme: dark)", color: "#03363D" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem("ifta-theme");var t=(s==="light"||s==="dark")?s:((window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light");var r=document.documentElement;r.classList.remove("light","dark");r.classList.add(t);r.dataset.theme=t;r.style.colorScheme=t;}catch(e){document.documentElement.classList.add("light");document.documentElement.dataset.theme="light";document.documentElement.style.colorScheme="light";}`,
          }}
        />
      </head>
      <body className="min-h-full" suppressHydrationWarning>
        {children}
        <PwaRegistration />
      </body>
    </html>
  );
}
