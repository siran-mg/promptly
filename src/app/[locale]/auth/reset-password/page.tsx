"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    if (newPassword.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSuccess(true);
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err) {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-md px-4 md:px-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="text-green-600 text-center">
                  {t("success")}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("newPassword")}</Label>
                    <Input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("confirmPassword")}</Label>
                    <Input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
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