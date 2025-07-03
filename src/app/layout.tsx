
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The `<html>` and `<body>` tags are rendered in `src/app/[locale]/layout.tsx`
  return children;
}
