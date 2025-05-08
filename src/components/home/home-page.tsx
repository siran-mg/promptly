import { Link } from "@/app/i18n";
import { CalendarClock, Clock, Mail, MessageSquare, CheckCircle, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export function HomePage() {
  const t = useTranslations();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Set visibility after a small delay for animation effect
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 xl:grid-cols-2 items-center">
              <div className={`flex flex-col justify-center space-y-6 transition-all duration-700 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-2 dark:bg-indigo-900/30 dark:text-indigo-300">
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    {t('common.appName')}
                  </span>
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300">
                    {t('home.hero.title')}
                  </h1>
                  <p className="max-w-[600px] text-gray-600 md:text-xl dark:text-gray-300 leading-relaxed">
                    {t('home.hero.description')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link href="/signup">
                    <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 group">
                      {t('home.hero.getStarted')}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/30">
                      {t('auth.login')}
                    </Button>
                  </Link>
                </div>
              </div>
              <div className={`flex items-center justify-center transition-all duration-700 delay-300 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="relative w-full max-w-[500px] p-6 bg-white border border-indigo-100 rounded-2xl shadow-xl dark:bg-gray-800 dark:border-gray-700 transform transition-all hover:scale-[1.02] duration-300">
                  <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
                    {t('common.new')}
                  </div>
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg dark:bg-indigo-900/30">
                        <CalendarClock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('home.hero.appointmentConfirmation')}</h3>
                    </div>
                    <div className="space-y-3 rounded-xl border border-indigo-100 p-5 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-md shadow-sm dark:bg-gray-700">
                          <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{t('home.hero.appointmentDate')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-md shadow-sm dark:bg-gray-700">
                          <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{t('home.hero.emailSent')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-md shadow-sm dark:bg-gray-700">
                          <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{t('home.hero.reminderScheduled')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-16 md:py-28 lg:py-36 bg-white dark:bg-gray-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-indigo-200/50 bg-[size:24px_24px] dark:bg-grid-indigo-950/20 opacity-20"></div>
          <div className="container px-4 md:px-6 relative">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-2 dark:bg-indigo-900/30 dark:text-indigo-300">
                <span>{t('home.features.title')}</span>
              </div>
              <div className="space-y-3 max-w-[800px]">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                  {t('home.features.title')}
                </h2>
                <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-xl/relaxed xl:text-xl/relaxed dark:text-gray-300 leading-relaxed">
                  {t('home.features.description')}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl border border-indigo-100 dark:border-gray-700 p-8 shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-200 dark:hover:border-indigo-800">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 w-fit mb-5">
                  <CalendarClock className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {t('home.features.booking.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 flex-grow">
                  {t('home.features.booking.description')}
                </p>
              </div>
              <div className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl border border-indigo-100 dark:border-gray-700 p-8 shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-200 dark:hover:border-indigo-800">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 w-fit mb-5">
                  <Mail className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {t('home.features.email.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 flex-grow">
                  {t('home.features.email.description')}
                </p>
              </div>
              <div className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl border border-indigo-100 dark:border-gray-700 p-8 shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-200 dark:hover:border-indigo-800">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 w-fit mb-5">
                  <MessageSquare className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {t('home.features.sms.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 flex-grow">
                  {t('home.features.sms.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 md:py-28 lg:py-36 bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
          <div className="container px-4 md:px-6">
            <div className="max-w-[900px] mx-auto">
              <div className="flex flex-col items-center justify-center space-y-8 text-center">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-300">
                    {t('home.cta.title')}
                  </h2>
                  <p className="max-w-[600px] text-gray-600 md:text-xl/relaxed lg:text-xl/relaxed xl:text-xl/relaxed dark:text-gray-300 leading-relaxed">
                    {t('home.cta.description')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Link href="/signup">
                    <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 group">
                      {t('home.cta.getStarted')}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
