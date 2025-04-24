import { notFound } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies, headers } from "next/headers";

// Removed header and footer imports for public form
import { DynamicAppointmentForm } from "@/components/appointments/dynamic-appointment-form";

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

    // Get the form settings
    console.log('Fetching form settings for user_id:', shareToken.user_id);

    // Check if there's a type parameter in the URL
    let typeId = null;
    try {
      const headerUrl = headers().get('x-url');
      console.log('Header URL:', headerUrl);

      if (headerUrl) {
        const url = new URL(headerUrl);
        typeId = url.searchParams.get('type');
        console.log('Extracted typeId from URL:', typeId);
      } else {
        console.log('No x-url header found');

        // Try to get the URL from the request headers
        const referer = headers().get('referer');
        console.log('Referer:', referer);

        if (referer) {
          try {
            const refererUrl = new URL(referer);
            const refererTypeId = refererUrl.searchParams.get('type');
            console.log('Extracted typeId from referer:', refererTypeId);
            if (refererTypeId) {
              typeId = refererTypeId;
            }
          } catch (refererError) {
            console.error('Error parsing referer URL:', refererError);
          }
        }
      }
    } catch (urlError) {
      console.error('Error parsing URL:', urlError);
      // Continue without the type parameter
    }

    console.log('Final typeId to be used:', typeId);

    let settings;

    if (typeId) {
      // First check if there are type-specific form settings
      console.log('Checking for type-specific form settings for type:', typeId);

      // Get the appointment type details first
      const { data: appointmentType, error: typeError } = await supabase
        .from("appointment_types")
        .select("*")
        .eq("id", typeId)
        .single();

      if (typeError) {
        console.error('Error fetching appointment type:', typeError);
      } else {
        console.log('Found appointment type:', appointmentType);
      }

      // Now get the type-specific form settings
      const { data: typeSettings, error: settingsError } = await supabase
        .from("form_settings_per_type")
        .select("*")
        .eq("user_id", shareToken.user_id)
        .eq("appointment_type_id", typeId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error fetching type-specific form settings:', settingsError);
      }

      if (typeSettings) {
        console.log('Found type-specific form settings:', typeSettings);
        settings = typeSettings;

        // If the type-specific settings don't have a title, use the appointment type name
        if (!settings.form_title && appointmentType) {
          settings.form_title = `Book a ${appointmentType.name} with ${profile.full_name}`;
        }
      } else if (appointmentType) {
        console.log('No type-specific form settings found, using appointment type name for title');
        // If no type-specific settings but we have the appointment type, create a default title
        settings = {
          form_title: `Book a ${appointmentType.name} with ${profile.full_name}`,
          form_description: "Fill out the form below to schedule your appointment.",
          logo_url: null,
          accent_color: "#6366f1"
        };
      }
    }

    // If no type-specific settings, use global settings
    if (!settings) {
      console.log('Using global form settings');
      try {
        const { data: formSettings } = await supabase
          .from("form_settings")
          .select("*")
          .eq("user_id", shareToken.user_id)
          .single();

        settings = formSettings;
      } catch (settingsError) {
        console.error('Error fetching global form settings:', settingsError);
        // Continue with default settings
      }
    }

    // Use default settings if none found
    if (!settings) {
      console.log('Using default form settings');
      settings = {
        form_title: `Book an Appointment with ${profile.full_name}`,
        form_description: "Fill out the form below to schedule your appointment.",
        logo_url: null,
        accent_color: "#6366f1"
      };
    }

    console.log('Form settings:', settings);

    // Ensure we have valid settings with defaults
    settings = {
      form_title: settings?.form_title || `Book an Appointment with ${profile.full_name}`,
      form_description: settings?.form_description || "Fill out the form below to schedule your appointment.",
      logo_url: settings?.logo_url || null,
      accent_color: settings?.accent_color || "#6366f1"
    };

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-8 sm:p-10">
              <div className="space-y-6">
                <DynamicAppointmentForm
                  userId={shareToken.user_id}
                  defaultTypeId={typeId}
                  initialSettings={settings}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in book appointment page:", error);
    return notFound();
  }
}
