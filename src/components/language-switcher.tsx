"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/app/i18n/index";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { locales } from "@/config/locales";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();

  // We don't need to manually extract the path anymore
  // next-intl's router.replace handles this for us

  // Handle language change
  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) return;

    // Use the router from next-intl to navigate to the same path with a different locale
    router.replace(pathname, { locale: newLocale });
  };

  // Get language display name
  const getLanguageDisplayName = (locale: string) => {
    switch (locale) {
      case 'en':
        return 'English';
      case 'fr':
        return 'Français';
      default:
        return locale;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Globe className="h-5 w-5" />
          <span className="sr-only">{t('settings.general.switchLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLanguageChange(loc)}
            className={locale === loc ? "bg-muted font-medium" : ""}
          >
            {getLanguageDisplayName(loc)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
