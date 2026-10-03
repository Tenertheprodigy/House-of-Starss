import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Docs | House of Stars',
  description: 'Guides for using House of Stars, including how to sell Telegram Stars through the official Telegram Mini App.',
};

export default function DocsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
