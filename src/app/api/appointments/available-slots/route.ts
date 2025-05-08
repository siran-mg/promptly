import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { startOfDay, endOfDay, format, parse, addMinutes } from 'date-fns';

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const userId = url.searchParams.get('userId');

    if (!date || !userId) {
      return NextResponse.json(
        { error: 'Date and userId are required parameters' },
        { status: 400 }
      );
    }

    // Parse the date parameter
    const selectedDate = new Date(date);
    
    // Create start and end of day for the selected date
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Fetch appointments for the selected date
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('date, appointment_type:appointment_type_id(duration)')
      .eq('user_id', userId)
      .gte('date', dayStart.toISOString())
      .lte('date', dayEnd.toISOString())
      .neq('status', 'cancelled'); // Exclude cancelled appointments

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    // Extract booked time slots
    const bookedSlots = appointments.map(appointment => {
      const appointmentDate = new Date(appointment.date);
      const duration = appointment.appointment_type?.duration || 60; // Default to 60 minutes if no duration specified
      
      return {
        time: format(appointmentDate, 'HH:mm'),
        duration: duration
      };
    });

    // Generate all possible time slots (30-minute increments)
    const allTimeSlots = generateTimeSlots();

    // Filter out booked slots
    const availableSlots = filterAvailableSlots(allTimeSlots, bookedSlots);

    return NextResponse.json({ 
      date: format(selectedDate, 'yyyy-MM-dd'),
      bookedSlots,
      availableSlots 
    });
  } catch (error) {
    console.error('Error in available slots API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate time slots from 00:00 to 23:30 in 30-minute increments
function generateTimeSlots() {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMinute = minute.toString().padStart(2, "0");
      slots.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return slots;
}

// Filter available slots based on booked slots
function filterAvailableSlots(allSlots: string[], bookedSlots: { time: string, duration: number }[]) {
  return allSlots.filter(slot => {
    // Check if this slot overlaps with any booked slot
    return !bookedSlots.some(bookedSlot => {
      const slotTime = parse(slot, 'HH:mm', new Date());
      const bookedTime = parse(bookedSlot.time, 'HH:mm', new Date());
      
      // Calculate end time of the booked slot
      const bookedEndTime = addMinutes(bookedTime, bookedSlot.duration);
      
      // Check if the current slot is within the booked slot's time range
      // or if the current slot + 30 minutes overlaps with the booked slot
      const slotEndTime = addMinutes(slotTime, 30);
      
      return (
        (slotTime >= bookedTime && slotTime < bookedEndTime) || // Slot starts during a booking
        (slotEndTime > bookedTime && slotEndTime <= bookedEndTime) || // Slot ends during a booking
        (slotTime <= bookedTime && slotEndTime >= bookedEndTime) // Slot completely contains a booking
      );
    });
  });
}
