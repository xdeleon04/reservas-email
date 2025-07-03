import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'en'
});
 
export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',

    '/', '/(es|en)/:path*'
  ]
};