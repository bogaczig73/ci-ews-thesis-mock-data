import './globals.css';
import { Inter } from 'next/font/google';
import Sidebar from './_components/Sidebar.jsx';

const inter = Inter({ subsets: ['latin', 'latin-ext'], display: 'swap' });

export const metadata = {
  title: 'EWS Mock Data Hub',
  description: 'Unified synthetic mock of every EWS data source (Sreality, PSP/MMR/ČSÚ/ČNB RSS, ARES), backed by Neon Postgres.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 px-5 md:px-10 py-8">
            <div className="max-w-6xl mx-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
