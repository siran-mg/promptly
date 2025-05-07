import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import BookingForm from "@/components/booking/booking-form";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function BookingPage() {
  const t = useTranslations();

  return (
    <>
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl px-4 md:px-6">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t('booking.title')}
              </h1>
              <p className="text-gray-500 md:text-xl dark:text-gray-400">
                {t('booking.subtitle')}
              </p>
            </div>
            <Suspense fallback={
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <BookingForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
