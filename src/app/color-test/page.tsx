import type { Metadata } from 'next';
import ColorTestClient from './ColorTestClient';

export const metadata: Metadata = {
  title: 'Color Test | Daily Tidbit',
  description: 'Testing Tailwind v4 custom brand colors',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ColorTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ColorTestClient />
      </div>
    </div>
  );
}