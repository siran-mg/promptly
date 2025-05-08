import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const typeParam = url.searchParams.get('type');
    const fieldName = url.searchParams.get('field');
    const searchQuery = url.searchParams.get('search') || '';

    // Validate page and pageSize
    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
      return NextResponse.json(
        { error: 'Invalid page or pageSize parameters' },
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

    // Parse type IDs (could be a single ID or a comma-separated list)
    const typeIds = typeParam ? typeParam.split(',') : [];

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build the query for total count
    let countQuery = supabase
      .from("appointments")
      .select('id', { count: 'exact' })
      .eq('user_id', session.user.id);

    // Build the main query
    let query = supabase
      .from("appointments")
      .select(`
        *,
        appointment_type:appointment_type_id(id, name, color, duration),
        field_values:appointment_field_values(id, field_id, value)
      `)
      .eq('user_id', session.user.id);

    // Apply filters if provided
    if (typeIds.length === 1) {
      // If only one type is selected, use eq
      query = query.eq('appointment_type_id', typeIds[0]);
      countQuery = countQuery.eq('appointment_type_id', typeIds[0]);
    } else if (typeIds.length > 1) {
      // If multiple types are selected, use in
      query = query.in('appointment_type_id', typeIds);
      countQuery = countQuery.in('appointment_type_id', typeIds);
    }

    // Apply search filter if provided
    if (searchQuery) {
      const searchFilter = `client_name.ilike.%${searchQuery}%,client_email.ilike.%${searchQuery}%,client_phone.ilike.%${searchQuery}%,status.ilike.%${searchQuery}%`;
      query = query.or(searchFilter);
      countQuery = countQuery.or(searchFilter);
    }

    // Apply field name filter if provided
    if (fieldName) {
      // This would require a more complex query with joins
      // For simplicity, we'll skip this for now
    }

    // Order by date
    query = query.order("date", { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    // Execute both queries
    const [appointmentsResult, countResult] = await Promise.all([
      query,
      countQuery
    ]);

    const { data: appointments, error } = appointmentsResult;
    const { count, error: countError } = { count: countResult.count ?? 0, error: countResult.error };

    if (error || countError) {
      console.error("Error fetching appointments:", error || countError);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    // Calculate total pages
    const totalPages = Math.ceil((count || 0) / pageSize);

    return NextResponse.json({
      appointments: appointments || [],
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error in paginated appointments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
