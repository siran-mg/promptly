import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import BookingForm from "@/components/booking/booking-form";

export default function BookingPage() {
  return (
    <>
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl px-4 md:px-6">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Book Your Appointment
              </h1>
              <p className="text-gray-500 md:text-xl dark:text-gray-400">
                Fill out the form below to schedule your appointment.
              </p>
            </div>
            <BookingForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
