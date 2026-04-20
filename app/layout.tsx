import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IndeedJobMatch — AI Job Matching',
  description: 'Upload your CV and find perfectly matched jobs using AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IJ</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">IndeedJobMatch</span>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
