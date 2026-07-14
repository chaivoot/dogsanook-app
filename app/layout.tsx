import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'หมาสนุก · ระบบติดตามการเรียนของน้องหมา',
  description:
    'พอร์ทัลติดตามความคืบหน้าคอร์สฝึกน้องหมา 10 เกม สำหรับลูกค้าหมาสนุก',
};

export const viewport: Viewport = {
  themeColor: '#221b16',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        {/* Prompt — the friendly rounded Thai/Latin font used on dogsanook.com.
            Loaded at runtime so builds don't depend on outbound network. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
