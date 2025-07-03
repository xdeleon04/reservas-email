import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  // The middleware already ensures that the locale is valid.
  return {
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
