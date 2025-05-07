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
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-6 w-6" />
          <Link href="/" className="text-xl font-bold">
            {t('common.appName')}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {!isLoading && (
            isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">{t('common.dashboard')}</Button>
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">{t('auth.login')}</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">{t('auth.signup')}</Button>
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
