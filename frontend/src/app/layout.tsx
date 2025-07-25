import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tyrex B2B - Türkiye\'nin En Büyük Lastik Pazaryeri',
  description: 'B2B lastik pazaryerinde binlerce ürün, dinamik fiyatlandırma ve hızlı teslimat. Perakendeciler için özel çözümler.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}