
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservas Email",
  description: "Effortless table reservations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The lang attribute is managed by the a more specific layout in /[locale]
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
