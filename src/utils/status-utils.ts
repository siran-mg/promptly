/**
 * Utility functions for handling appointment status values
 */

/**
 * Get the translation key for a status value
 * @param status The status value to translate
 * @returns The translation key for the status
 */
export function getStatusTranslationKey(status: string): string {
  switch (status) {
    case "scheduled":
      return 'appointments.scheduled';
    case "completed":
      return 'appointments.completed';
    case "cancelled":
      return 'appointments.cancelled';
    // Add more status types as needed
    default:
      return status;
  }
}

/**
 * Get the variant for a status badge
 * @param status The status value
 * @returns The variant name for the badge
 */
export function getStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" | "success" {
  switch (status) {
    case "scheduled":
      return 'default';
    case "completed":
      return 'success';
    case "cancelled":
      return 'destructive';
    // Add more status types as needed
    default:
      return 'outline';
  }
}

/**
 * Check if a status is considered "active"
 * @param status The status value to check
 * @returns True if the status is active
 */
export function isActiveStatus(status: string): boolean {
  return status === 'scheduled';
}

/**
 * Check if a status is considered "completed"
 * @param status The status value to check
 * @returns True if the status is completed
 */
export function isCompletedStatus(status: string): boolean {
  return status === 'completed';
}

/**
 * Check if a status is considered "cancelled"
 * @param status The status value to check
 * @returns True if the status is cancelled
 */
export function isCancelledStatus(status: string): boolean {
  return status === 'cancelled';
}

/**
 * Get all available status values
 * @returns Array of status values
 */
export function getAllStatusValues(): string[] {
  return ['scheduled', 'completed', 'cancelled'];
}
