/**
 * Send an SMS notification to a user
 */
export async function sendSmsNotification(
  userId: string,
  message: string,
  phoneNumber?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        phone: phoneNumber,
        message,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error sending SMS notification:', result);
      return { success: false, error: result.error || 'Failed to send SMS notification' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Format a phone number to E.164 format
 * This is a simple implementation and might need to be enhanced for international numbers
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Check if the number already has a country code (assuming +1 for US/Canada)
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  } else if (digitsOnly.length > 10 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  } else if (digitsOnly.length > 10) {
    return `+${digitsOnly}`;
  }
  
  // Return original if we can't format it
  return phoneNumber;
}

/**
 * Validate a phone number
 * This is a simple implementation and might need to be enhanced for international numbers
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Basic validation - should be at least 10 digits
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  return digitsOnly.length >= 10;
}
