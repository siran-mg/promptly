"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { LogoutButton } from "@/components/auth/logout-button";
import { MobileHeaderNav } from "@/components/layout/mobile-header-nav";
import { useTranslations } from "next-intl";

export function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const t = useTranslations();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-indigo-100 dark:border-gray-800 bg-white/80 backdrop-blur-sm dark:bg-gray-950/80">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-md dark:bg-indigo-900/30">
            <CalendarClock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            {t('common.appName')}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {!isLoading && (
            isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/30">
                    {t('common.dashboard')}
                  </Button>
                </Link>
                <LogoutButton className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/30">
                    {t('auth.login')}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200">
                    {t('auth.signup')}
                  </Button>
                </Link>
              </>
            )
          )}
        </nav>

        {/* Mobile Navigation */}
        {!isLoading && (
          <div className="md:hidden">
            <MobileHeaderNav isAuthenticated={isAuthenticated} />
          </div>
        )}
      </div>
    </header>
  );
}
