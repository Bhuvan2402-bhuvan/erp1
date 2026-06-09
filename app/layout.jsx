import './globals.css';
import Providers from './Providers';

export const metadata = {
  title: 'Student Attendance Management Portal',
  description: 'Student Attendance Management Portal - Volunteer & Hours Audit System',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#4f46e5',
}

import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
