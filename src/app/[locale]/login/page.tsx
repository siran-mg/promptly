"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/app/i18n";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const t = useTranslations("auth");

  return (
    <>
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-md px-4 md:px-6">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tighter">
                {t("welcomeBack")}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {t("enterCredentials")}
              </p>
            </div>
            <LoginForm />
            <div className="text-center text-sm">
              {t("dontHaveAccount")}{" "}
              <Link
                href="/signup"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("signupButton")}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
