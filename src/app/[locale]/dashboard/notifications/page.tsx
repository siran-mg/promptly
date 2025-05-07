import { NotificationsPage } from "@/components/notifications/notifications-page";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getTranslations } from "next-intl/server";
import { Bell } from "lucide-react";

export const metadata = {
  title: "Notifications",
  description: "View and manage your notifications",
};

export default async function NotificationsRoute({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale, namespace: "notifications" });
  return (
    <DashboardShell>
      <DashboardHeader
        heading={
          <span className="flex items-center gap-2">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
            {t("title")}
          </span>
        }
        text={t("description")}
      />
      <div className="grid gap-4 sm:gap-6 md:gap-8">
        <NotificationsPage />
      </div>
    </DashboardShell>
  );
}
