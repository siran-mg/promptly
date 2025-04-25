import { format, formatRelative, Locale } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

type DateFormatOptions = {
  locale?: string;
  includeTime?: boolean;
  timeOnly?: boolean;
  relative?: boolean;
  shortDate?: boolean;
};

/**
 * Get the date-fns locale object based on the locale string
 */
export function getDateLocale(locale: string = 'en'): Locale {
  switch (locale) {
    case 'fr':
      return fr;
    default:
      return enUS;
  }
}

/**
 * Format a date according to the locale
 */
export function formatDate(
  date: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const {
    locale = 'en',
    includeTime = false,
    timeOnly = false,
    relative = false,
    shortDate = false,
  } = options;

  // Convert string or number to Date if needed
  const dateObj = date instanceof Date ? date : new Date(date);
  const dateLocale = getDateLocale(locale);

  // Return relative date if requested (e.g., "yesterday", "2 days ago")
  if (relative) {
    return formatRelative(dateObj, new Date(), { locale: dateLocale });
  }

  // Format only time
  if (timeOnly) {
    const timeFormat = locale === 'fr' ? 'HH:mm' : 'h:mm a';
    return format(dateObj, timeFormat, { locale: dateLocale });
  }

  // Format date (with or without time)
  let dateFormat: string;

  if (shortDate) {
    // Short date format (e.g., "01/25/2023" for en, "25/01/2023" for fr)
    dateFormat = locale === 'fr' ? 'dd/MM/yyyy' : 'MM/dd/yyyy';
  } else {
    // Long date format (e.g., "Monday, January 25, 2023" for en)
    dateFormat = 'PPPP';
  }

  // Add time if requested
  if (includeTime) {
    const timeFormat = locale === 'fr' ? 'HH:mm' : 'h:mm a';
    dateFormat = `${dateFormat} ${timeFormat}`;
  }

  return format(dateObj, dateFormat, { locale: dateLocale });
}

/**
 * Format a time according to the locale
 */
export function formatTime(
  date: Date | string | number,
  locale: string = 'en'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const dateLocale = getDateLocale(locale);
  const timeFormat = locale === 'fr' ? 'HH:mm' : 'h:mm a';

  return format(dateObj, timeFormat, { locale: dateLocale });
}

/**
 * Format a date range according to the locale
 */
export function formatDateRange(
  startDate: Date | string | number,
  endDate: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const { locale = 'en' } = options;

  const formattedStartDate = formatDate(startDate, { ...options, includeTime: false });
  const formattedEndDate = formatDate(endDate, { ...options, includeTime: false });

  // If same day, return single date with time range
  const startDateObj = startDate instanceof Date ? startDate : new Date(startDate);
  const endDateObj = endDate instanceof Date ? endDate : new Date(endDate);

  if (startDateObj.toDateString() === endDateObj.toDateString()) {
    const startTime = formatTime(startDateObj, locale);
    const endTime = formatTime(endDateObj, locale);
    return `${formattedStartDate}, ${startTime} - ${endTime}`;
  }

  // Different days, return full date range
  return `${formattedStartDate} - ${formattedEndDate}`;
}

/**
 * Format a duration in minutes to a human-readable string
 */
export function formatDuration(minutes: number, locale: string = 'en'): string {
  if (minutes < 60) {
    return locale === 'fr'
      ? `${minutes} minute${minutes > 1 ? 's' : ''}`
      : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return locale === 'fr'
      ? `${hours} heure${hours > 1 ? 's' : ''}`
      : `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  return locale === 'fr'
    ? `${hours} heure${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`
    : `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
}

/**
 * Format a date to show only month and year according to the locale
 */
export function formatMonthYear(
  date: Date | string | number,
  locale: string = 'en'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const dateLocale = getDateLocale(locale);

  // Use different formats based on locale
  // In French, the month abbreviation format is different
  const monthYearFormat = 'MMM yyyy';

  // The date-fns locale will handle the proper formatting based on the locale

  return format(dateObj, monthYearFormat, { locale: dateLocale });
}
