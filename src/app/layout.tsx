import type { Metadata } from 'next';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'House of Stars \u2014 The Exchange for Illiquid Assets',
  description: 'Convert supported illiquid assets into usable value and choose between stocks, crypto, or fiat withdrawal options with House of Stars.',
  openGraph: {
    title: 'House of Stars \u2014 Make your value liquid.',
    description: 'The exchange for illiquid assets. One exchange. Multiple ways to exit.',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
