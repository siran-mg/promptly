import { useLocale } from 'next-intl';
import {
  formatDate,
  formatTime,
  formatDateRange,
  formatDuration,
  formatMonthYear
} from '@/utils/date-format';

/**
 * Hook for formatting dates according to the current locale
 */
export function useDateFormatter() {
  const locale = useLocale();

  return {
    /**
     * Format a date according to the current locale
     */
    formatDate: (
      date: Date | string | number,
      options: {
        includeTime?: boolean;
        timeOnly?: boolean;
        relative?: boolean;
        shortDate?: boolean;
      } = {}
    ) => {
      return formatDate(date, { ...options, locale });
    },

    /**
     * Format a time according to the current locale
     */
    formatTime: (date: Date | string | number) => {
      return formatTime(date, locale);
    },

    /**
     * Format a date range according to the current locale
     */
    formatDateRange: (
      startDate: Date | string | number,
      endDate: Date | string | number,
      options: {
        includeTime?: boolean;
        shortDate?: boolean;
      } = {}
    ) => {
      return formatDateRange(startDate, endDate, { ...options, locale });
    },

    /**
     * Format a duration in minutes to a human-readable string
     */
    formatDuration: (minutes: number) => {
      return formatDuration(minutes, locale);
    },

    /**
     * Format a date to show only month and year according to the current locale
     */
    formatMonthYear: (date: Date | string | number) => {
      return formatMonthYear(date, locale);
    }
  };
}
