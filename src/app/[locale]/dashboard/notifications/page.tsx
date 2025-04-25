import { NotificationsPage } from "@/components/notifications/notifications-page";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata = {
  title: "Notifications",
  description: "View and manage your notifications",
};

export default async function NotificationsRoute() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Notifications"
        text="View and manage your notifications"
      />
      <div className="grid gap-8">
        <NotificationsPage />
      </div>
    </DashboardShell>
  );
}
