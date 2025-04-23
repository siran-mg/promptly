import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-6 w-6" />
          <Link href="/" className="text-xl font-bold">
            Promptly
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign Up</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
