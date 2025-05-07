"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/app/i18n";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  const t = useTranslations("auth");

  return (
    <>
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-md px-4 md:px-6">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tighter">
                {t("createAccount")}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {t("enterDetails")}
              </p>
            </div>
            <SignupForm />
            <div className="text-center text-sm">
              {t("alreadyHaveAccountQuestion")}{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("loginButton")}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
