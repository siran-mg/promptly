import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import EmailSettings from '@/components/settings/email-settings';
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Mail } from "lucide-react";

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'settings.email' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EmailSettingsPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'settings.email' });

  return (
    <DashboardShell>
      <DashboardHeader
        heading={
          <span className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-indigo-600" />
            {t('title')}
          </span>
        }
        text={t('description')}
      />
      <div className="mt-6">
        <EmailSettings locale={locale} />
      </div>
    </DashboardShell>
  );
}
