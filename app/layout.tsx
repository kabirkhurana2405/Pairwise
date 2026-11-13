import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pairwise — Meet beyond the profile',
  description: 'A thoughtful way to discover the potential between two people.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
