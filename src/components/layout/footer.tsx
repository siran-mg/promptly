import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="text-center md:text-left">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Coachly. All rights reserved.
          </p>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/terms"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Privacy
          </Link>
          <Link
            href="/contact"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
