import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HASAN SHOP Admin',
  description: 'Administration dashboard for HASAN SHOP',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
