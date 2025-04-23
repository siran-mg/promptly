import { notFound } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AppointmentForm } from "@/components/appointments/appointment-form";

export default async function BookAppointmentPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;

  // Validate that the token is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    console.error("Invalid token format:", token);
    return notFound();
  }

  try {
    // Get the user associated with this token
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    console.log('Fetching share token with token:', token);
    const { data: shareToken, error } = await supabase
      .from("form_share_tokens")
      .select("user_id")
      .eq("token", token)
      .single();

    if (error || !shareToken) {
      console.error("Error fetching share token:", error);
      return notFound();
    }

    console.log('Found share token:', shareToken);

    // Get the user's profile
    console.log('Fetching profile for user_id:', shareToken.user_id);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", shareToken.user_id)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching user profile:", profileError);
      return notFound();
    }

    console.log('Found profile:', profile);

    return (
      <>
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-3xl px-4 md:px-6">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Book an Appointment with {profile.full_name}
                </h1>
                <p className="text-gray-500 md:text-xl dark:text-gray-400">
                  Fill out the form below to schedule your appointment.
                </p>
              </div>

              <AppointmentForm userId={shareToken.user_id} />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  } catch (error) {
    console.error("Error in book appointment page:", error);
    return notFound();
  }
}
