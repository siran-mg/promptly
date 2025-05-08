import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import EmailSettings from '@/components/settings/email-settings';

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
  return (
    <div className="container mx-auto py-6">
      <EmailSettings locale={locale} />
    </div>
  );
}
