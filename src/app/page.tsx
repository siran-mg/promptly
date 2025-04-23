import Link from "next/link";
import { CalendarClock, Clock, Mail, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Appointments & Reminders Made Simple
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Accept appointments and automatically send confirmation and reminders via email and SMS — with zero calendar integrations required.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/signup">
                    <Button size="lg" className="w-full min-[400px]:w-auto">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[500px] p-4 bg-white border rounded-lg shadow-lg dark:bg-gray-950">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Appointment Confirmation</h3>
                    </div>
                    <div className="space-y-2 rounded-md border p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <p className="text-sm">Thursday, October 12, 2023 at 10:00 AM</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <p className="text-sm">Confirmation email sent</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <p className="text-sm">Reminder scheduled for 24h before</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Key Features
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Everything you need to manage appointments and keep your clients informed
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <CalendarClock className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Easy Booking</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Simple booking form for clients to schedule appointments
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <Mail className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Email Confirmations</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Automatic email confirmations sent to clients
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <MessageSquare className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">SMS Reminders</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Automated SMS reminders before appointments
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to Get Started?
                </h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Sign up today and start managing your appointments with ease.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/signup">
                  <Button size="lg" className="w-full min-[400px]:w-auto">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
