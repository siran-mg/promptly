import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendClientConfirmationEmail, sendClientRejectionEmail } from '@/lib/server/email';

/**
 * Handle GET requests for admin actions (confirm/reject appointments)
 * This endpoint is accessed via links in the admin email
 */
export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const appointmentId = url.searchParams.get('id');
    const locale = url.searchParams.get('locale') || 'en';

    // Validate parameters
    if (!action || !appointmentId) {
      return NextResponse.json(
        { error: 'Action and appointment ID are required' },
        { status: 400 }
      );
    }

    // Validate action type
    if (action !== 'confirm' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "confirm" or "reject"' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // If not authenticated, redirect to login page with return URL
      const returnUrl = encodeURIComponent(`/api/appointments/admin-action?action=${action}&id=${appointmentId}`);
      return NextResponse.redirect(`${url.origin}/login?returnUrl=${returnUrl}`);
    }

    // Update the appointment status based on the action
    const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';

    const { data, error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId)
      .select(`
        *,
        appointment_type:appointment_type_id(id, name, color, duration)
      `)
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return NextResponse.json(
        { error: 'Failed to update appointment status' },
        { status: 500 }
      );
    }

    // Create a notification for the appointment status change
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: data.user_id,
        type: `appointment_${newStatus}`,
        content: {
          clientName: data.client_name,
          date: data.date,
          status: newStatus
        },
        related_id: data.id,
        is_read: false,
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue anyway as the main action was successful
    }

    // Get the user's profile for branding information
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', data.user_id)
      .single();

    // Get form settings for branding
    const { data: formSettings } = await supabase
      .from('form_settings')
      .select('title, description, logo_url, accent_color')
      .eq('user_id', data.user_id)
      .single();

    // Get email settings
    const { data: emailSettings } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', data.user_id)
      .single();

    // Check if client emails are enabled
    const sendClientEmails = emailSettings?.send_client_emails !== false; // Default to true if not set

    // Prepare branding information
    const branding = {
      companyName: profileData?.full_name || 'Promptly',
      logoUrl: formSettings?.logo_url || profileData?.avatar_url,
      accentColor: formSettings?.accent_color || '#6366f1'
    };

    // Send email to client based on the action (if enabled)
    if (sendClientEmails) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

      // Prepare custom text based on email settings
      let customText;

      if (action === 'confirm') {
        customText = emailSettings ? {
          subject: emailSettings.client_confirmation_subject,
          greeting: emailSettings.client_confirmation_greeting,
          footer: emailSettings.client_confirmation_footer
        } : undefined;

        // Send confirmation email to client
        const emailResult = await sendClientConfirmationEmail(
          data,
          baseUrl,
          locale as string,
          customText,
          branding
        );

        if (!emailResult.success) {
          console.error('Error sending client confirmation email:', emailResult.error);
          // Continue anyway as the main action was successful
        }
      } else {
        customText = emailSettings ? {
          subject: emailSettings.client_rejection_subject,
          greeting: emailSettings.client_rejection_greeting,
          footer: emailSettings.client_rejection_footer
        } : undefined;

        // Send rejection email to client
        const emailResult = await sendClientRejectionEmail(
          data,
          baseUrl,
          locale as string,
          customText,
          branding
        );

        if (!emailResult.success) {
          console.error('Error sending client rejection email:', emailResult.error);
          // Continue anyway as the main action was successful
        }
      }
    } else {
      console.log('Client emails are disabled in settings. No email sent.');
    }

    // Redirect to a success page
    return NextResponse.redirect(
      `${url.origin}/dashboard/appointments?status=${newStatus}&id=${appointmentId}`
    );
  } catch (error) {
    console.error('Error in admin action API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
