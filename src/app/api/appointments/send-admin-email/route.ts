import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendAppointmentConfirmationRequestEmail } from '@/lib/server/email';

export async function POST(request: Request) {
  try {
    // Parse request body
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch the appointment details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        appointment_type:appointment_type_id(id, name, color, duration)
      `)
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      console.error('Error fetching appointment:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointment details' },
        { status: 500 }
      );
    }

    // Get the admin email (in a real app, this might come from user settings)
    // For now, we'll use the authenticated user's email as the admin email
    const adminEmail = session.user.email;

    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Admin email not found' },
        { status: 500 }
      );
    }

    // Get email settings for customization
    const { data: emailSettings } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    // Get the user's profile for branding information
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', session.user.id)
      .single();

    // Get form settings for branding
    const { data: formSettings } = await supabase
      .from('form_settings')
      .select('title, description, logo_url, accent_color')
      .eq('user_id', session.user.id)
      .single();

    // Prepare branding information
    const branding = {
      companyName: profileData?.full_name || 'Promptly',
      logoUrl: formSettings?.logo_url || profileData?.avatar_url,
      accentColor: formSettings?.accent_color || '#6366f1'
    };

    // Prepare custom text based on email settings
    const customText = emailSettings ? {
      subject: emailSettings.admin_confirmation_subject,
      greeting: emailSettings.admin_confirmation_greeting,
      footer: emailSettings.admin_confirmation_footer
    } : undefined;

    // Get the base URL for the application
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Get the locale from the request headers or default to 'en'
    const acceptLanguage = request.headers.get('accept-language') || 'en';
    const locale = acceptLanguage.startsWith('fr') ? 'fr' : 'en';

    // Send the email
    const emailResult = await sendAppointmentConfirmationRequestEmail(
      adminEmail,
      appointment,
      baseUrl,
      locale,
      customText,
      branding
    );

    if (!emailResult.success) {
      console.error('Error sending email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Return success response with email details
    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
      previewUrl: emailResult.previewUrl // This is useful for development with Ethereal
    });
  } catch (error) {
    console.error('Error in send admin email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
