import { useTranslations } from 'next-intl';
import {
  getStatusTranslationKey,
  getStatusVariant,
  isActiveStatus,
  isCompletedStatus,
  isCancelledStatus,
  getAllStatusValues
} from '@/utils/status-utils';

/**
 * Hook for formatting and working with appointment status values
 */
export function useStatusFormatter() {
  const t = useTranslations();

  return {
    /**
     * Translate a status value to the current locale
     * @param status The status value to translate
     * @returns The translated status text
     */
    translateStatus: (status: string): string => {
      const key = getStatusTranslationKey(status);
      // If the key is the same as the status, it means we don't have a translation key for it
      return key === status ? status : t(key);
    },

    /**
     * Get the variant for a status badge
     * @param status The status value
     * @returns The variant name for the badge
     */
    getStatusVariant: (status: string): "default" | "destructive" | "outline" | "secondary" | "success" => {
      return getStatusVariant(status);
    },

    /**
     * Check if a status is considered "active"
     * @param status The status value to check
     * @returns True if the status is active
     */
    isActiveStatus: (status: string): boolean => {
      return isActiveStatus(status);
    },

    /**
     * Check if a status is considered "completed"
     * @param status The status value to check
     * @returns True if the status is completed
     */
    isCompletedStatus: (status: string): boolean => {
      return isCompletedStatus(status);
    },

    /**
     * Check if a status is considered "cancelled"
     * @param status The status value to check
     * @returns True if the status is cancelled
     */
    isCancelledStatus: (status: string): boolean => {
      return isCancelledStatus(status);
    },

    /**
     * Get all available status values
     * @returns Array of status values
     */
    getAllStatusValues: (): string[] => {
      return getAllStatusValues();
    },

    /**
     * Get all available status values with their translations
     * @returns Array of objects with value and label properties
     */
    getAllStatusOptions: (): Array<{ value: string; label: string }> => {
      return getAllStatusValues().map(value => ({
        value,
        label: t(getStatusTranslationKey(value))
      }));
    }
  };
}
