import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse request body
    const { appointmentIds } = await request.json();

    if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or missing appointmentIds' },
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

    // Verify that all appointments belong to the current user
    const { data: appointments, error: verifyError } = await supabase
      .from('appointments')
      .select('id')
      .eq('user_id', session.user.id)
      .in('id', appointmentIds);

    if (verifyError) {
      console.error('Error verifying appointments:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify appointments' },
        { status: 500 }
      );
    }

    // Check if all requested appointments belong to the user
    const verifiedIds = appointments.map(a => a.id);
    const unauthorizedIds = appointmentIds.filter(id => !verifiedIds.includes(id));

    if (unauthorizedIds.length > 0) {
      return NextResponse.json(
        { error: 'Unauthorized access to one or more appointments' },
        { status: 403 }
      );
    }

    // Delete the appointments
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .in('id', appointmentIds);

    if (deleteError) {
      console.error('Error deleting appointments:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete appointments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${appointmentIds.length} appointments`,
      deletedCount: appointmentIds.length
    });
  } catch (error) {
    console.error('Error in bulk delete API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
