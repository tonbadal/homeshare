import { Home } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Home className="h-8 w-8 text-[var(--primary)]" />
        <span className="text-2xl font-bold text-[var(--foreground)]">SharedHome</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
