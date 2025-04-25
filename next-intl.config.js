/** @type {import('next-intl').NextIntlConfig} */
const config = {
  // These are the locales you want to support in your application
  locales: ['en', 'fr'],

  // This is the default locale you want to be used when visiting
  // a non-locale prefixed path e.g. `/hello`
  defaultLocale: 'en',

  // These are all the locales that are supported in your application
  localeDetection: true,

  // This is a list of locale domains and the default locale they
  // should handle (these are only required when you're using a domain strategy)
  // domains: [
  //   {
  //     domain: 'example.com',
  //     defaultLocale: 'en',
  //   },
  //   {
  //     domain: 'example.fr',
  //     defaultLocale: 'fr',
  //   },
  // ],
};

module.exports = config;
