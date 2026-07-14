import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-admin',
});

export const metadata: Metadata = {
  title: {
    default: 'HASAN SHOP Admin',
    template: '%s · HASAN SHOP Ops',
  },
  description: 'Operations console for HASAN SHOP Algeria',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={manrope.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
