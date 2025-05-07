"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

interface MobileHeaderNavProps {
  isAuthenticated: boolean;
}

export function MobileHeaderNav({ isAuthenticated }: MobileHeaderNavProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  // Close the sheet when a navigation item is clicked
  const handleNavClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t('common.menu')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[250px] sm:w-[300px] p-0">
        <SheetHeader className="border-b p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center">
              <CalendarClock className="h-5 w-5 text-white" />
            </div>
            <SheetTitle className="font-bold text-lg">{t('common.appName')}</SheetTitle>
          </div>
        </SheetHeader>

        <div className="py-6 px-4">
          <nav className="flex flex-col space-y-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={handleNavClick}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-indigo-600 transition-colors"
                >
                  {t('common.dashboard')}
                </Link>
                <div className="pt-2">
                  <LogoutButton
                    className="w-full"
                  />
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={handleNavClick}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-indigo-600 transition-colors"
                >
                  {t('auth.login')}
                </Link>
                <Link href="/signup" onClick={handleNavClick}>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                    {t('auth.signup')}
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
