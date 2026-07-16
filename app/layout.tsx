import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "IFTA Consulting Client Portal",
    template: "%s | IFTA Consulting",
  },
  description:
    "Secure consulting client portal and workflow management platform for IFTA Consulting (K) Ltd.",
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
      </body>
    </html>
  );
}
