import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { MobileAppBar } from "@/components/dashboard/mobile-app-bar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-40 flex h-16 items-center border-b bg-background px-4 md:hidden">
        <MobileAppBar />
      </div>
      <div className="container flex-1 items-start md:grid md:grid-cols-[260px_1fr] md:gap-6 lg:grid-cols-[280px_1fr] lg:gap-10">
        <aside className="fixed top-0 z-30 hidden h-screen w-full shrink-0 overflow-y-auto border-r border-indigo-100 bg-white/80 backdrop-blur-sm md:sticky md:block">
          <DashboardNav />
        </aside>
        <main className="flex w-full flex-col overflow-hidden px-3 py-3 md:p-4 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
