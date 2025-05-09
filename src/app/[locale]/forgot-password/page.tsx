"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("auth.forgotPassword");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(t("error"));
    } else {
      setSuccess(true);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-md px-4 md:px-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-green-600">{t("success")}</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="block mb-1">{t("emailLabel")}</span>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder={t("emailPlaceholder")}
                    autoComplete="email"
                  />
                </label>
                {error && <div className="text-red-600">{error}</div>}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? t("loading") : t("submit")}
                </Button>
              </form>
            )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
} 