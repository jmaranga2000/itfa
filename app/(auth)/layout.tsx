import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              I
            </span>
            <span>
              <span className="block text-sm font-bold text-foreground">IFTA Consulting</span>
              <span className="block text-xs font-medium text-muted-foreground">Secure access</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
        {children}
      </div>
    </main>
  );
}
