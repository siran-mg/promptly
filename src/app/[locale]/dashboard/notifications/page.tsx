import { NotificationsPage } from "@/components/notifications/notifications-page";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getTranslations } from "next-intl/server";

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
        heading={t("title")}
        text={t("description")}
      />
      <div className="grid gap-8">
        <NotificationsPage />
      </div>
    </DashboardShell>
  );
}
