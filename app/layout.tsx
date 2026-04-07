import type {Metadata, Viewport} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Predix',
  description: 'Next-generation mobile-first prediction trading platform',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Predix',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased bg-black" suppressHydrationWarning>{children}</body>
    </html>
  );
}
