
import type { Metadata } from "next";
import { setRequestLocale, getMessages } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Toaster } from "@/components/ui/toaster";
import "../globals.css";
import { AuthProvider } from "@/context/AuthContext";
import {NextIntlClientProvider} from 'next-intl';
import { ThemeProvider } from "@/components/ThemeProvider";

export async function generateMetadata({params}: {params: {locale: string}}): Promise<Metadata> {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations('Metadata');
 
  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string};
}>) {
  const { locale } = params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            <NextIntlClientProvider messages={messages}>
                <AuthProvider>
                    {children}
                </AuthProvider>
                <Toaster />
            </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
