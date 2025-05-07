import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { BodyStyleFixer } from "@/components/body-style-fixer";
import { locales, defaultLocale } from '@/config/locales';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Promptly - Appointment & Reminder SaaS",
  description: "Schedule appointments and send automated reminders via email and SMS",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Load the messages for the requested locale
async function getMessages(locale: string) {
  console.log('Loading messages for locale:', locale);
  try {
    const messages = (await import(`../../messages/${locale}.json`)).default;
    console.log('Successfully loaded messages for locale:', locale);
    return messages;
  } catch (error) {
    console.error('Error loading messages for locale:', locale, error);
    // If we can't load the requested locale, try the default locale
    try {
      console.log('Trying to load default locale messages:', defaultLocale);
      const defaultMessages = (await import(`../../messages/${defaultLocale}.json`)).default;
      console.log('Successfully loaded default messages');
      return defaultMessages;
    } catch (fallbackError) {
      console.error('Error loading default messages:', fallbackError);
      notFound();
    }
  }
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  console.log('Layout locale:', locale);

  // Validate that the incoming locale is valid
  if (!locales.includes(locale as any)) {
    console.log('Invalid locale, showing 404:', locale);
    // Instead of showing a 404, we could redirect to the default locale
    // but for now, we'll just show a 404 to be consistent with Next.js behavior
    notFound();
  }

  const messages = await getMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
          {/* Add the BodyStyleFixer to fix pointer-events issues */}
          <BodyStyleFixer />
          <div className="flex min-h-screen flex-col">
            {children}
          </div>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
