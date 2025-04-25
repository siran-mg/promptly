import {getRequestConfig} from 'next-intl/server';
import {locales, defaultLocale} from './config/locales';

export default getRequestConfig(async ({locale}) => {
  // If locale is undefined, use the default locale
  const resolvedLocale = locale || defaultLocale;

  // Validate that the incoming locale is valid
  if (!locales.includes(resolvedLocale as any)) {
    console.warn(`Locale '${resolvedLocale}' is not supported, falling back to ${defaultLocale}`);
    // Fall back to the default locale instead of throwing an error
    return {
      locale: defaultLocale,
      messages: (await import(`./messages/${defaultLocale}.json`)).default,
      timeZone: 'UTC'
    };
  }

  // Load the messages for the requested locale
  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
    timeZone: 'UTC'
  };
});
